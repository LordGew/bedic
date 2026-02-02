# 🛡️ SISTEMA DE MODERACIÓN AUTOMATIZADA - BEDIC

## 📋 **ESTRATEGIA DE MODERACIÓN MULTINIVEL**

---

## 🎯 **NIVEL 1: FILTROS AUTOMÁTICOS (Sin intervención humana)**

### **1.1 Filtro de Palabras Prohibidas**

**Implementación:**
```javascript
// backend/services/contentModerationService.js
const badWords = {
  es: ['palabra1', 'palabra2', 'insulto1', ...],
  en: ['badword1', 'badword2', ...]
};

function detectBadWords(text, language = 'es') {
  const words = badWords[language] || badWords.es;
  const regex = new RegExp(words.join('|'), 'gi');
  return regex.test(text);
}
```

**Acciones:**
- ❌ **Bloqueo inmediato** - Comentario no se publica
- 📧 **Notificación al usuario** - "Tu comentario viola nuestras políticas"
- 📊 **Strike al usuario** - 3 strikes = suspensión temporal

---

### **1.2 Detector de Lenguaje Abusivo (IA)**

**Opciones de Implementación:**

#### **Opción A: Perspective API (Google) - RECOMENDADO**
```javascript
const { Perspective } = require('perspective-api-client');
const perspective = new Perspective({ apiKey: process.env.PERSPECTIVE_API_KEY });

async function analyzeComment(text) {
  const result = await perspective.analyze({
    comment: { text },
    languages: ['es', 'en'],
    requestedAttributes: {
      TOXICITY: {},
      SEVERE_TOXICITY: {},
      INSULT: {},
      PROFANITY: {},
      THREAT: {}
    }
  });
  
  return {
    toxicity: result.attributeScores.TOXICITY.summaryScore.value,
    severe: result.attributeScores.SEVERE_TOXICITY.summaryScore.value,
    insult: result.attributeScores.INSULT.summaryScore.value,
    profanity: result.attributeScores.PROFANITY.summaryScore.value,
    threat: result.attributeScores.THREAT.summaryScore.value
  };
}

// Umbrales de moderación
const THRESHOLDS = {
  AUTO_REJECT: 0.85,  // Bloqueo automático
  AUTO_FLAG: 0.65,    // Revisión manual
  AUTO_APPROVE: 0.50  // Aprobado automático
};
```

**Ventajas:**
- ✅ Gratis hasta 1M requests/día
- ✅ Multiidioma (español, inglés)
- ✅ Precisión del 90%+
- ✅ Mantenido por Google

#### **Opción B: OpenAI Moderation API**
```javascript
const openai = require('openai');

async function moderateContent(text) {
  const moderation = await openai.moderations.create({
    input: text
  });
  
  return moderation.results[0];
}
```

---

### **1.3 Detector de Spam**

```javascript
function detectSpam(text, userId) {
  const spamIndicators = {
    repeatedChars: /(.)\1{4,}/g,           // "aaaaaaa"
    excessiveCaps: /[A-Z]{10,}/g,          // "COMPRAAAA"
    urls: /(https?:\/\/[^\s]+)/g,          // Links no autorizados
    phoneNumbers: /\d{10,}/g,              // Números de teléfono
    emails: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi
  };
  
  let score = 0;
  if (spamIndicators.repeatedChars.test(text)) score += 20;
  if (spamIndicators.excessiveCaps.test(text)) score += 15;
  if (spamIndicators.urls.test(text)) score += 30;
  if (spamIndicators.phoneNumbers.test(text)) score += 25;
  if (spamIndicators.emails.test(text)) score += 25;
  
  return score > 50; // Es spam
}
```

---

### **1.4 Rate Limiting Inteligente**

```javascript
// Prevenir flood de comentarios
const rateLimit = {
  comments: {
    perMinute: 5,
    perHour: 30,
    perDay: 100
  },
  reports: {
    perHour: 10,
    perDay: 50
  }
};

async function checkRateLimit(userId, action) {
  const key = `ratelimit:${action}:${userId}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, 60); // 1 minuto
  }
  
  return count <= rateLimit[action].perMinute;
}
```

---

## 🎯 **NIVEL 2: MODERACIÓN ASISTIDA (Mínima intervención)**

### **2.1 Sistema de Reportes Automáticos**

```javascript
// Auto-moderación por comunidad
async function handleUserReport(reportData) {
  const { contentId, contentType, reason, reporterId } = reportData;
  
  // Incrementar contador de reportes
  const reportCount = await Report.countDocuments({ 
    contentId, 
    contentType 
  });
  
  // Acciones automáticas según reportes
  if (reportCount >= 3) {
    // 3+ reportes = Ocultar automáticamente
    await hideContent(contentId, contentType);
    await notifyModerators(contentId, 'AUTO_HIDDEN');
  }
  
  if (reportCount >= 10) {
    // 10+ reportes = Eliminar automáticamente
    await deleteContent(contentId, contentType);
    await suspendUser(content.authorId, '24h');
  }
}
```

---

### **2.2 Sistema de Reputación de Usuarios**

```javascript
const userReputation = {
  NEW_USER: { trustScore: 0, moderationLevel: 'STRICT' },
  TRUSTED: { trustScore: 100, moderationLevel: 'NORMAL' },
  VERIFIED: { trustScore: 500, moderationLevel: 'RELAXED' },
  MODERATOR: { trustScore: 1000, moderationLevel: 'NONE' }
};

function calculateTrustScore(user) {
  let score = 0;
  
  // Factores positivos
  score += user.verifiedEmail ? 10 : 0;
  score += user.verifiedPhone ? 20 : 0;
  score += user.accountAge * 2; // días
  score += user.helpfulReviews * 5;
  score += user.photoUploads * 3;
  
  // Factores negativos
  score -= user.strikes * 50;
  score -= user.deletedComments * 10;
  score -= user.reportedContent * 20;
  
  return Math.max(0, score);
}

// Usuarios nuevos tienen moderación más estricta
async function moderateByReputation(userId, content) {
  const user = await User.findById(userId);
  const trustScore = calculateTrustScore(user);
  
  if (trustScore < 50) {
    // Usuario nuevo: moderación estricta
    return await strictModeration(content);
  } else if (trustScore > 500) {
    // Usuario confiable: moderación relajada
    return { approved: true, autoApprove: true };
  }
}
```

---

## 🎯 **NIVEL 3: AUTOMATIZACIÓN DE PROCESOS CRÍTICOS**

### **3.1 Cron Jobs para Mantenimiento**

```javascript
// backend/jobs/moderationJobs.js
const cron = require('node-cron');

// Cada hora: Revisar contenido flaggeado
cron.schedule('0 * * * *', async () => {
  const flaggedContent = await Content.find({ 
    status: 'FLAGGED',
    createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });
  
  for (const content of flaggedContent) {
    // Si lleva 24h flaggeado sin acción, eliminar
    await content.delete();
  }
});

// Cada día: Limpiar usuarios suspendidos
cron.schedule('0 0 * * *', async () => {
  await User.updateMany(
    { 
      suspendedUntil: { $lt: new Date() },
      status: 'SUSPENDED'
    },
    { 
      status: 'ACTIVE',
      $unset: { suspendedUntil: 1 }
    }
  );
});

// Cada semana: Resetear strikes menores
cron.schedule('0 0 * * 0', async () => {
  await User.updateMany(
    { strikes: { $lte: 2 } },
    { strikes: 0 }
  );
});
```

---

### **3.2 Webhooks para Eventos Críticos**

```javascript
// Notificaciones automáticas a Slack/Discord
async function notifyAdmins(event, data) {
  const webhook = process.env.ADMIN_WEBHOOK_URL;
  
  const alerts = {
    MASS_REPORTS: `⚠️ ${data.count} reportes en ${data.timeframe}`,
    SPAM_WAVE: `🚨 Detectado spam masivo de ${data.userId}`,
    TOXIC_CONTENT: `☢️ Contenido tóxico detectado: ${data.contentId}`,
    ACCOUNT_BREACH: `🔒 Posible cuenta comprometida: ${data.userId}`
  };
  
  await fetch(webhook, {
    method: 'POST',
    body: JSON.stringify({
      text: alerts[event],
      data
    })
  });
}
```

---

## 🎯 **NIVEL 4: PANEL DE ADMINISTRACIÓN SIMPLIFICADO**

### **4.1 Dashboard de Moderación**

**Solo para casos que requieren decisión humana:**

```javascript
// Endpoints del panel admin
router.get('/admin/moderation/queue', protect, adminOnly, async (req, res) => {
  // Solo mostrar contenido que necesita revisión manual
  const queue = await Content.find({
    status: 'PENDING_REVIEW',
    moderationScore: { $gte: 0.65, $lt: 0.85 } // Zona gris
  })
  .sort({ reportCount: -1, createdAt: 1 })
  .limit(50);
  
  res.json({ queue });
});

// Acción rápida del admin
router.post('/admin/moderation/action', protect, adminOnly, async (req, res) => {
  const { contentId, action } = req.body; // approve, reject, ban_user
  
  await executeModeration Action(contentId, action, req.user.id);
  
  res.json({ success: true });
});
```

---

## 🔐 **SEGURIDAD Y ACCESO ESPECIAL**

### **5.1 Roles y Permisos**

```javascript
const roles = {
  USER: {
    permissions: ['read', 'comment', 'rate']
  },
  MODERATOR: {
    permissions: ['read', 'comment', 'rate', 'moderate_content', 'ban_users']
  },
  ADMIN: {
    permissions: ['*'] // Todos los permisos
  },
  SUPER_ADMIN: {
    permissions: ['*', 'manage_admins', 'system_config']
  }
};

// Middleware de autorización
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

---

### **5.2 Autenticación 2FA para Admins**

```javascript
const speakeasy = require('speakeasy');

// Generar secreto 2FA
router.post('/admin/2fa/setup', protect, adminOnly, async (req, res) => {
  const secret = speakeasy.generateSecret({
    name: `BEDIC (${req.user.email})`
  });
  
  req.user.twoFactorSecret = secret.base32;
  await req.user.save();
  
  res.json({ 
    qrCode: secret.otpauth_url,
    secret: secret.base32
  });
});

// Verificar 2FA en login
router.post('/admin/2fa/verify', async (req, res) => {
  const { token } = req.body;
  
  const verified = speakeasy.totp.verify({
    secret: req.user.twoFactorSecret,
    encoding: 'base32',
    token
  });
  
  if (!verified) {
    return res.status(401).json({ error: 'Invalid 2FA code' });
  }
  
  // Generar token de sesión admin
  const adminToken = jwt.sign(
    { userId: req.user.id, role: 'ADMIN' },
    process.env.JWT_SECRET,
    { expiresIn: '2h' } // Sesiones cortas para admins
  );
  
  res.json({ token: adminToken });
});
```

---

## 📊 **IMPLEMENTACIÓN RECOMENDADA**

### **Fase 1: Filtros Básicos (1-2 días)**
```bash
✅ Filtro de palabras prohibidas
✅ Detector de spam básico
✅ Rate limiting
✅ Sistema de strikes
```

### **Fase 2: IA y Automatización (3-5 días)**
```bash
✅ Integrar Perspective API
✅ Sistema de reputación
✅ Auto-moderación por reportes
✅ Cron jobs de limpieza
```

### **Fase 3: Panel Admin Simplificado (2-3 días)**
```bash
✅ Dashboard de moderación
✅ Cola de revisión manual
✅ Acciones rápidas
✅ Logs de moderación
```

### **Fase 4: Seguridad Avanzada (2-3 días)**
```bash
✅ 2FA para admins
✅ Roles y permisos
✅ Webhooks de alertas
✅ Auditoría de acciones
```

---

## 💰 **COSTOS ESTIMADOS**

| Servicio | Costo | Límite Gratis |
|----------|-------|---------------|
| **Perspective API** | Gratis | 1M requests/día |
| **OpenAI Moderation** | $0.0002/1K tokens | - |
| **Redis (Rate Limiting)** | $5-10/mes | 30MB gratis |
| **Webhooks (Slack/Discord)** | Gratis | Ilimitado |

**Total estimado: $5-10/mes** (con tráfico moderado)

---

## 🎯 **RECOMENDACIONES FINALES**

### **Automatizar al Máximo:**
1. ✅ **90% automático** - Filtros + IA + Comunidad
2. ✅ **8% asistido** - Sistema de reportes
3. ✅ **2% manual** - Solo casos complejos

### **Panel Admin Mínimo:**
- Solo para revisar "zona gris" (score 0.65-0.85)
- Acciones rápidas (aprobar/rechazar/banear)
- Dashboard con métricas clave
- No micromanagement

### **Seguridad Robusta:**
- 2FA obligatorio para admins
- Sesiones cortas (2 horas)
- Logs de todas las acciones
- Alertas automáticas de anomalías

---

**¿Quieres que implemente alguna de estas fases primero?**
