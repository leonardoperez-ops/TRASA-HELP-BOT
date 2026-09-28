# TRASA HelpBot — Soporte Técnico de Infraestructura & Google Chat App

Asistente virtual de primer nivel de Soporte Técnico de Infraestructura para TRASA.
Diagnostica y asiste en problemas de Hardware, Windows, Redes (LAN/Wi-Fi), VPN, Impresoras de red, Active Directory y conectividad, derivando los incidentes no resueltos a `tickets@trasa.com.ar`.

La aplicación cuenta con una arquitectura híbrida full-stack que sirve tanto la interfaz web (SPA en React 19) como los endpoints de API y el Webhook oficial de Google Chat en Node.js/Express.

---

## 1. Cómo ejecutar localmente

### Requisitos previos
- Node.js 20+ o 22+
- npm o bun

### Instalación de dependencias
```bash
npm install
```

---

## 2. Cómo configurar variables de entorno

Copia el archivo de plantilla `.env.example` a `.env`:

```bash
cp .env.example .env
```

Configura las siguientes variables en `.env`:

```env
# Clave de API de Gemini (Google AI Studio)
GEMINI_API_KEY="AIzaSy..."

# URL base pública del servicio (para Cloud Run o desarrollo local)
APP_URL="http://localhost:3000"

# Puerto HTTP del servidor (por defecto 3000)
PORT=3000

# Número de Proyecto de Google Cloud (Project Number) donde se configura la Google Chat App
# Utilizado para validar el audience y la firma criptográfica del ID Token enviado por Google Chat
GOOGLE_CHAT_APP_PROJECT_NUMBER="123456789012"
```

> **Nota para desarrollo local**: Si `GOOGLE_CHAT_APP_PROJECT_NUMBER` no está configurado y el entorno es de desarrollo (`NODE_ENV != 'production'`), el webhook permite pruebas con `Authorization: Bearer dev-token`.

---

## 3. Cómo iniciar el servidor

### Modo desarrollo (con recarga rápida y middleware de Vite)
```bash
npm run dev
```
El servidor quedará disponible en `http://localhost:3000`.

### Modo producción (compilación estática y servidor optimizado)
```bash
# 1. Compilar los estáticos de React
npm run build

# 2. Iniciar el servidor Express en producción
npm start
```

---

## 4. Cómo probar el webhook localmente

El webhook de Google Chat escucha en:
`POST http://localhost:3000/api/google-chat/webhook`

### A. Prueba de seguridad (Solicitud no autenticada → Debe devolver 401)
```bash
curl -i -X POST http://localhost:3000/api/google-chat/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"MESSAGE"}'
```
*Respuesta esperada*: `HTTP/1.1 401 Unauthorized`

### B. Prueba de bienvenida (`ADDED_TO_SPACE`)
Simula cuando un usuario agrega el bot o le abre un mensaje directo (DM):
```bash
curl -X POST http://localhost:3000/api/google-chat/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{
    "type": "ADDED_TO_SPACE",
    "space": { "name": "spaces/DM_LEO", "type": "DM" },
    "user": { "displayName": "Leonardo Perez", "email": "leonardo.perez@trasa.com.ar" }
  }'
```

### C. Prueba de mensaje con mención (`MESSAGE`)
Simula un usuario consultando por la VPN de TRASA:
```bash
curl -X POST http://localhost:3000/api/google-chat/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{
    "type": "MESSAGE",
    "space": { "name": "spaces/SPACE_IT", "type": "SPACE" },
    "message": {
      "thread": { "name": "spaces/SPACE_IT/threads/VPN_CASE_1" },
      "argumentText": "@TRASA HelpBot no puedo conectarme a la VPN desde mi casa"
    },
    "user": { "displayName": "Leonardo Perez", "email": "leonardo.perez@trasa.com.ar" }
  }'
```

### D. Prueba de consulta fuera de alcance (RRHH / Sueldos)
Simula un usuario preguntando un tema que no es de Infraestructura:
```bash
curl -X POST http://localhost:3000/api/google-chat/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{
    "type": "MESSAGE",
    "space": { "name": "spaces/DM_LEO", "type": "DM" },
    "message": {
      "thread": { "name": "spaces/DM_LEO/threads/T1" },
      "argumentText": "¿Cuándo se cobran las vacaciones?"
    },
    "user": { "displayName": "Leonardo Perez", "email": "leonardo.perez@trasa.com.ar" }
  }'
```
*Respuesta esperada*:
`{"text":"Soy TRASA HelpBot y estoy especializado exclusivamente en Soporte Técnico de Infraestructura. Esta consulta corresponde a otra área de TRASA."}`

---

## 5. Cómo desplegar en Google Cloud Run

La aplicación está lista para Cloud Run ejecutando Node.js / TypeScript:

1. **Variables requeridas en Cloud Run**:
   - `GEMINI_API_KEY`: Tu clave de Gemini.
   - `GOOGLE_CHAT_APP_PROJECT_NUMBER`: El Project Number de tu proyecto de Google Cloud.
   - `NODE_ENV`: `production`

2. **Despliegue directo mediante Google Cloud SDK**:
   ```bash
   gcloud run deploy trasa-helpbot \
     --source . \
     --region us-east1 \
     --allow-unauthenticated \
     --set-env-vars "NODE_ENV=production,GOOGLE_CHAT_APP_PROJECT_NUMBER=123456789012"
   ```

3. El servicio escuchará automáticamente en `0.0.0.0` y el puerto asignado por Cloud Run (`PORT`).

---

## 6. Cómo configurar posteriormente Google Chat en Google Cloud Console

Una vez que tengas la URL de Cloud Run (ej: `https://trasa-helpbot-xxxx-uc.a.run.app`):

1. Ve a **Google Cloud Console** en tu proyecto de TRASA.
2. Ingresa a **APIs & Services** > **Library** y habilita **Google Chat API**.
3. En el menú lateral, selecciona **Google Chat API** > **Configuration**.
4. Completa los campos:
   - **App name**: `TRASA HelpBot`
   - **Avatar URL**: URL de logo o icono de soporte de TRASA.
   - **Description**: `Asistente de Soporte Técnico de Infraestructura de TRASA (Hardware, Redes, VPN, Windows).`
   - **Functionality**:
     - Marcar: *Receive 1:1 messages* (Mensajes directos).
     - Marcar: *Join spaces and group conversations* (Espacios y canales).
   - **Connection settings**:
     - Seleccionar: **HTTP endpoint**
     - **HTTP URL**: `https://<TU-CLOUD-RUN-URL>/api/google-chat/webhook`
   - **Visibility**:
     - Seleccionar: *Make this Google Chat app available to specific people and groups in your organization* o *everyone in your organization* (`@trasa.com.ar`).
5. Guarda la configuración. ¡Tu bot ya estará listo para recibir mensajes directos y menciones en Google Chat!
