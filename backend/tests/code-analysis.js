/**
 * ANÁLISIS DE CÓDIGO Y MEJORES PRÁCTICAS - BACKEND BEDIC
 * 
 * Este script analiza el código fuente en busca de:
 * - Secretos hardcodeados
 * - Malas prácticas
 * - Código inseguro
 * - Dependencias vulnerables
 * - Problemas de rendimiento
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const results = {
  secrets: [],
  badPractices: [],
  securityIssues: [],
  performanceIssues: [],
  codeSmells: []
};

console.log('🔍 ANÁLISIS DE CÓDIGO Y MEJORES PRÁCTICAS - BACKEND BEDIC\n');
console.log('='.repeat(70));
console.log('');

// ============ PATRONES A BUSCAR ============

const PATTERNS = {
  secrets: [
    { pattern: /password\s*=\s*['"][^'"]+['"]/gi, name: 'Contraseña hardcodeada' },
    { pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/gi, name: 'API Key hardcodeada' },
    { pattern: /secret\s*=\s*['"][^'"]+['"]/gi, name: 'Secret hardcodeado' },
    { pattern: /token\s*=\s*['"][^'"]{20,}['"]/gi, name: 'Token hardcodeado' },
    { pattern: /mongodb:\/\/[^'"]+:[^'"]+@/gi, name: 'Credenciales MongoDB en código' },
    { pattern: /mysql:\/\/[^'"]+:[^'"]+@/gi, name: 'Credenciales MySQL en código' },
    { pattern: /postgres:\/\/[^'"]+:[^'"]+@/gi, name: 'Credenciales PostgreSQL en código' }
  ],
  
  badPractices: [
    { pattern: /console\.log\(/g, name: 'console.log en código' },
    { pattern: /eval\(/g, name: 'Uso de eval()' },
    { pattern: /setTimeout\([^,]+,\s*0\)/g, name: 'setTimeout con delay 0' },
    { pattern: /\.findOne\(\{\}\)/g, name: 'findOne sin filtros' },
    { pattern: /\.find\(\{\}\)/g, name: 'find sin filtros ni límite' },
    { pattern: /process\.exit\(/g, name: 'process.exit en código' }
  ],
  
  security: [
    { pattern: /innerHTML\s*=/g, name: 'Uso de innerHTML (XSS risk)' },
    { pattern: /dangerouslySetInnerHTML/g, name: 'dangerouslySetInnerHTML (XSS risk)' },
    { pattern: /exec\(/g, name: 'Ejecución de comandos (Command Injection risk)' },
    { pattern: /new Function\(/g, name: 'new Function() (Code Injection risk)' },
    { pattern: /\$where:/g, name: '$where en MongoDB (NoSQL Injection risk)' },
    { pattern: /req\.query\.\w+\s*\)/g, name: 'Uso directo de req.query sin validación' },
    { pattern: /req\.params\.\w+\s*\)/g, name: 'Uso directo de req.params sin validación' }
  ],
  
  performance: [
    { pattern: /\.find\([^)]*\)\.forEach/g, name: 'forEach después de find (usar cursor)' },
    { pattern: /for\s*\([^)]*\)\s*{[^}]*await/g, name: 'await dentro de for loop' },
    { pattern: /\.map\([^)]*\)\.map\(/g, name: 'Múltiples .map() encadenados' },
    { pattern: /JSON\.parse\(JSON\.stringify/g, name: 'Deep clone ineficiente' }
  ],
  
  codeSmells: [
    { pattern: /function\s+\w+\([^)]{100,}\)/g, name: 'Función con muchos parámetros' },
    { pattern: /if\s*\([^)]*\)\s*{[^}]{500,}}/g, name: 'Bloque if muy largo' },
    { pattern: /catch\s*\([^)]*\)\s*{\s*}/g, name: 'Catch block vacío' },
    { pattern: /\/\/\s*TODO:/gi, name: 'TODO pendiente' },
    { pattern: /\/\/\s*FIXME:/gi, name: 'FIXME pendiente' },
    { pattern: /\/\/\s*HACK:/gi, name: 'HACK en código' }
  ]
};

// ============ FUNCIONES DE ANÁLISIS ============

function scanDirectory(dir, extensions = ['.js', '.ts']) {
  const files = [];
  
  function scan(directory) {
    try {
      const items = fs.readdirSync(directory);
      
      for (const item of items) {
        const fullPath = path.join(directory, item);
        
        try {
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            // Ignorar node_modules y carpetas ocultas
            if (item !== 'node_modules' && !item.startsWith('.')) {
              scan(fullPath);
            }
          } else if (stat.isFile()) {
            const ext = path.extname(fullPath);
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        } catch (err) {
          // Ignorar errores de permisos
        }
      }
    } catch (err) {
      console.error(`Error escaneando directorio ${directory}:`, err.message);
    }
  }
  
  scan(dir);
  return files;
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Buscar secretos
    for (const { pattern, name } of PATTERNS.secrets) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        results.secrets.push({
          file: relativePath,
          line: lineNumber,
          issue: name,
          code: match[0]
        });
      }
    }
    
    // Buscar malas prácticas
    for (const { pattern, name } of PATTERNS.badPractices) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        results.badPractices.push({
          file: relativePath,
          line: lineNumber,
          issue: name
        });
      }
    }
    
    // Buscar problemas de seguridad
    for (const { pattern, name } of PATTERNS.security) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        results.securityIssues.push({
          file: relativePath,
          line: lineNumber,
          issue: name
        });
      }
    }
    
    // Buscar problemas de rendimiento
    for (const { pattern, name } of PATTERNS.performance) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        results.performanceIssues.push({
          file: relativePath,
          line: lineNumber,
          issue: name
        });
      }
    }
    
    // Buscar code smells
    for (const { pattern, name } of PATTERNS.codeSmells) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        results.codeSmells.push({
          file: relativePath,
          line: lineNumber,
          issue: name
        });
      }
    }
  } catch (err) {
    console.error(`Error analizando archivo ${filePath}:`, err.message);
  }
}

function checkDependencies() {
  console.log('📦 Verificando dependencias vulnerables...\n');
  
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
      console.log('⚠️  No se encontró package.json\n');
      return;
    }
    
    // Ejecutar npm audit
    try {
      execSync('npm audit --json', { encoding: 'utf8', stdio: 'pipe' });
      console.log('✅ No se encontraron vulnerabilidades en dependencias\n');
    } catch (error) {
      try {
        const auditResult = JSON.parse(error.stdout);
        
        if (auditResult.metadata) {
          const { vulnerabilities } = auditResult.metadata;
          
          console.log('⚠️  Vulnerabilidades encontradas:');
          console.log(`   - Críticas: ${vulnerabilities.critical || 0}`);
          console.log(`   - Altas: ${vulnerabilities.high || 0}`);
          console.log(`   - Moderadas: ${vulnerabilities.moderate || 0}`);
          console.log(`   - Bajas: ${vulnerabilities.low || 0}`);
          console.log('');
          
          if (vulnerabilities.critical > 0 || vulnerabilities.high > 0) {
            console.log('🚨 Ejecuta "npm audit fix" para corregir vulnerabilidades\n');
          }
        }
      } catch (parseError) {
        console.log('⚠️  No se pudo analizar el resultado de npm audit\n');
      }
    }
  } catch (err) {
    console.log('⚠️  Error verificando dependencias:', err.message, '\n');
  }
}

function checkEnvironmentVariables() {
  console.log('🔐 Verificando variables de entorno...\n');
  
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  No se encontró archivo .env');
    console.log('   Asegúrate de tener un archivo .env con las variables necesarias\n');
    return;
  }
  
  if (!fs.existsSync(envExamplePath)) {
    console.log('⚠️  No se encontró archivo .env.example');
    console.log('   Considera crear un .env.example como plantilla\n');
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'PORT'
  ];
  
  const missingVars = [];
  for (const varName of requiredVars) {
    if (!envContent.includes(varName)) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.log('⚠️  Variables de entorno faltantes:');
    missingVars.forEach(v => console.log(`   - ${v}`));
    console.log('');
  } else {
    console.log('✅ Todas las variables de entorno requeridas están presentes\n');
  }
  
  // Verificar que .env esté en .gitignore
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('.env')) {
      console.log('🚨 CRÍTICO: .env no está en .gitignore');
      console.log('   Agrega .env a .gitignore para evitar exponer secretos\n');
    } else {
      console.log('✅ .env está correctamente en .gitignore\n');
    }
  }
}

function printResults() {
  console.log('\n');
  console.log('='.repeat(70));
  console.log('📊 RESUMEN DEL ANÁLISIS DE CÓDIGO');
  console.log('='.repeat(70));
  console.log('');
  
  // Secretos hardcodeados
  if (results.secrets.length > 0) {
    console.log('🚨 SECRETOS HARDCODEADOS (CRÍTICO):');
    results.secrets.forEach(s => {
      console.log(`   ${s.file}:${s.line} - ${s.issue}`);
      if (s.code) {
        console.log(`      ${s.code.substring(0, 50)}...`);
      }
    });
    console.log('');
  }
  
  // Problemas de seguridad
  if (results.securityIssues.length > 0) {
    console.log('⚠️  PROBLEMAS DE SEGURIDAD:');
    const grouped = {};
    results.securityIssues.forEach(s => {
      if (!grouped[s.issue]) grouped[s.issue] = [];
      grouped[s.issue].push(s);
    });
    
    Object.entries(grouped).forEach(([issue, items]) => {
      console.log(`   ${issue} (${items.length} ocurrencias)`);
      items.slice(0, 3).forEach(item => {
        console.log(`      ${item.file}:${item.line}`);
      });
      if (items.length > 3) {
        console.log(`      ... y ${items.length - 3} más`);
      }
    });
    console.log('');
  }
  
  // Malas prácticas
  if (results.badPractices.length > 0) {
    console.log('⚠️  MALAS PRÁCTICAS:');
    const grouped = {};
    results.badPractices.forEach(s => {
      if (!grouped[s.issue]) grouped[s.issue] = [];
      grouped[s.issue].push(s);
    });
    
    Object.entries(grouped).forEach(([issue, items]) => {
      console.log(`   ${issue} (${items.length} ocurrencias)`);
    });
    console.log('');
  }
  
  // Problemas de rendimiento
  if (results.performanceIssues.length > 0) {
    console.log('⚡ PROBLEMAS DE RENDIMIENTO:');
    const grouped = {};
    results.performanceIssues.forEach(s => {
      if (!grouped[s.issue]) grouped[s.issue] = [];
      grouped[s.issue].push(s);
    });
    
    Object.entries(grouped).forEach(([issue, items]) => {
      console.log(`   ${issue} (${items.length} ocurrencias)`);
    });
    console.log('');
  }
  
  // Code smells
  if (results.codeSmells.length > 0) {
    console.log('👃 CODE SMELLS:');
    const grouped = {};
    results.codeSmells.forEach(s => {
      if (!grouped[s.issue]) grouped[s.issue] = [];
      grouped[s.issue].push(s);
    });
    
    Object.entries(grouped).forEach(([issue, items]) => {
      console.log(`   ${issue} (${items.length} ocurrencias)`);
    });
    console.log('');
  }
  
  // Evaluación general
  console.log('🏥 EVALUACIÓN GENERAL:');
  const totalIssues = results.secrets.length + results.securityIssues.length + 
                      results.badPractices.length + results.performanceIssues.length;
  
  if (results.secrets.length > 0) {
    console.log('   ❌ CRÍTICO - Se encontraron secretos hardcodeados');
  } else if (results.securityIssues.length > 10) {
    console.log('   ⚠️  POBRE - Múltiples problemas de seguridad detectados');
  } else if (totalIssues > 20) {
    console.log('   ⚠️  ACEPTABLE - Varias mejoras recomendadas');
  } else if (totalIssues > 5) {
    console.log('   ✅ BUENO - Pocas mejoras necesarias');
  } else {
    console.log('   ✅ EXCELENTE - Código limpio y seguro');
  }
  
  console.log(`   Total de issues: ${totalIssues}`);
  console.log('');
  
  // Recomendaciones
  console.log('💡 RECOMENDACIONES:');
  if (results.secrets.length > 0) {
    console.log('   1. Mover todos los secretos a variables de entorno');
    console.log('   2. Verificar que .env esté en .gitignore');
    console.log('   3. Rotar todos los secretos expuestos');
  }
  if (results.securityIssues.length > 0) {
    console.log('   4. Implementar validación de entrada en todos los endpoints');
    console.log('   5. Sanitizar datos antes de usarlos en consultas');
  }
  if (results.badPractices.length > 0) {
    console.log('   6. Remover console.log antes de producción');
    console.log('   7. Implementar logging estructurado');
  }
  if (results.performanceIssues.length > 0) {
    console.log('   8. Optimizar consultas a la base de datos');
    console.log('   9. Usar operaciones asíncronas eficientemente');
  }
  
  console.log('');
  console.log('='.repeat(70));
}

// ============ EJECUCIÓN PRINCIPAL ============

async function runCodeAnalysis() {
  try {
    console.log('🚀 Iniciando análisis de código...\n');
    
    // Verificar dependencias
    checkDependencies();
    
    // Verificar variables de entorno
    checkEnvironmentVariables();
    
    // Escanear archivos
    console.log('📁 Escaneando archivos...\n');
    const files = scanDirectory(process.cwd());
    console.log(`   Encontrados ${files.length} archivos para analizar\n`);
    
    // Analizar cada archivo
    console.log('🔍 Analizando código...\n');
    for (const file of files) {
      analyzeFile(file);
    }
    
    // Imprimir resultados
    printResults();
    
    process.exit(results.secrets.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Error durante el análisis de código:', error);
    process.exit(1);
  }
}

// Ejecutar análisis
runCodeAnalysis();
