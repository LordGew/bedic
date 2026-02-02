# 🔑 Generación de Token de GitHub

Para que pueda crear el repositorio y hacer push automáticamente, necesito un **Personal Access Token (PAT)** de GitHub.

## Pasos para Generar el Token

1. **Ir a GitHub Settings:**
   - https://github.com/settings/tokens

2. **Click en "Generate new token"**
   - Selecciona "Generate new token (classic)"

3. **Configurar el Token:**
   - **Note:** "BEDIC Platform - Automated Setup"
   - **Expiration:** 90 days (o tu preferencia)
   - **Scopes:** Selecciona:
     - ✓ `repo` (Full control of private repositories)
     - ✓ `admin:repo_hook` (Full control of repository hooks)
     - ✓ `admin:org_hook` (Full control of organization hooks)

4. **Generar y Copiar:**
   - Click "Generate token"
   - **COPIA EL TOKEN** (no lo compartas públicamente)
   - Guárdalo en un lugar seguro

5. **Proporcionar el Token:**
   - Envíame el token en el chat
   - O guárdalo en un archivo temporal

## Seguridad

⚠️ **IMPORTANTE:**
- Este token tiene acceso a tus repositorios
- NO lo compartas públicamente
- Puedes regenerarlo o eliminarlo en cualquier momento
- Se eliminará automáticamente después de 90 días

## Alternativa: Usar SSH

Si prefieres no usar token, podemos usar SSH:
1. Generar SSH key: `ssh-keygen -t ed25519 -C "tu_email@gmail.com"`
2. Agregar a GitHub: https://github.com/settings/keys
3. Configurar Git para usar SSH

---

**¿Cuál prefieres?**
- A) Generar y proporcionar el token (más rápido)
- B) Usar SSH (más seguro)
- C) Hacer push manualmente con HTTPS
