# Guía de Uso - Sistema de API Keys Temporales (MVP)

## Descripción

Este sistema permite generar API keys temporales para acceder al API Gateway GraphQL de forma segura, sin exponer la API_KEY principal del archivo `.env`. Esta es la versión MVP que incluye únicamente la funcionalidad esencial.

## Configuración

Las siguientes variables de entorno están disponibles en `.env`:

```bash
# Configuración de API Keys temporales
API_KEY_PREFIX=bgw                 # Prefijo para las API keys generadas
API_KEY_DEFAULT_DURATION=24h       # Duración por defecto
API_KEY_MAX_DURATION=30d          # Duración máxima permitida
```

## Funcionalidades Disponibles

### 1. Generar API Key Temporal
**Endpoint:** `generateApiKey` (Mutation)
**Descripción:** Genera una nueva API key temporal con duración configurable.
**Acceso:** Público (no requiere autenticación)

```graphql
mutation GenerateApiKey($input: GenerateApiKeyInput!) {
  generateApiKey(input: $input) {
    apiKey
    expiresAt
    expiresIn
    message
  }
}
```

**Variables:**
```json
{
  "input": {
    "duration": "24h",
    "description": "API Key para aplicación móvil"
  }
}
```

**Duraciones válidas:** `1h`, `24h`, `7d`, `30d`

**Nota:** Esta es la única funcionalidad disponible en la versión MVP. Las funciones de validar, listar, revocar y limpiar API keys han sido removidas para simplificar el sistema.

## Uso del Sistema

### Paso 1: Generar una API Key

1. Accede al GraphQL Playground en `http://localhost:4000/graphql`
2. Ejecuta la mutation `generateApiKey`:

```graphql
mutation {
  generateApiKey(input: {
    duration: "24h",
    description: "Testing API Key"
  }) {
    apiKey
    expiresAt
    expiresIn
    message
  }
}
```

3. Guarda la `apiKey` devuelta (ej: `bgw_a1b2c3d4e5f6...`)

### Paso 2: Usar la API Key en Requests

Incluye la API key en el header `x-api-key` de tus requests:

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: bgw_a1b2c3d4e5f6..." \
  -d '{
    "query": "query { listApiKeys { id apiKey description } }"
  }'
```

### Paso 3: Validar API Key (Opcional)

Puedes verificar si una API key es válida:

```graphql
query {
  validateApiKey(apiKey: "bgw_a1b2c3d4e5f6...") {
    valid
    expiresAt
    remainingTime
  }
}
```

## Ejemplos de Testing

### Test 1: Generar y usar API Key

```javascript
// 1. Generar API Key
const generateResponse = await fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: `
      mutation {
        generateApiKey(input: {
          duration: "1h",
          description: "Test Key"
        }) {
          apiKey
          expiresAt
          message
        }
      }
    `
  })
});

const { data } = await generateResponse.json();
const apiKey = data.generateApiKey.apiKey;

// 2. Usar API Key para hacer request
const testResponse = await fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey
  },
  body: JSON.stringify({
    query: `
      query {
        listApiKeys {
          id
          description
          isActive
        }
      }
    `
  })
});

console.log(await testResponse.json());
```

### Test 2: Validar comportamiento de expiración

```javascript
// Generar API Key de 1 hora
const response = await fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `
      mutation {
        generateApiKey(input: { duration: "1h" }) {
          apiKey
          expiresIn
        }
      }
    `
  })
});

const { data } = await response.json();
const apiKey = data.generateApiKey.apiKey;

// Validar inmediatamente (debería ser válida)
const validation1 = await fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `query { validateApiKey(apiKey: "${apiKey}") { valid remainingTime } }`
  })
});

console.log('Validación inicial:', await validation1.json());

// Revocar la key
const revoke = await fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `mutation { revokeApiKey(apiKey: "${apiKey}") { success message } }`
  })
});

console.log('Revocación:', await revoke.json());

// Validar después de revocar (debería ser inválida)
const validation2 = await fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `query { validateApiKey(apiKey: "${apiKey}") { valid } }`
  })
});

console.log('Validación post-revocación:', await validation2.json());
```

## Seguridad

- Las API keys se almacenan hasheadas usando SHA-256
- Las keys expiradas se limpian automáticamente
- El sistema valida cada request antes de procesarlo
- La API_KEY principal nunca se expone a los clientes

## Notas de Desarrollo

- Actualmente usa almacenamiento en memoria (para desarrollo)
- En producción se recomienda usar Redis para persistencia
- Las keys se auto-limpian al expirar
- El prefijo `bgw` identifica las keys del Banking Gateway

## Troubleshooting

### Error: "API Key requerida"
- Asegúrate de incluir el header `x-api-key` en tu request

### Error: "API Key inválida o expirada"
- Verifica que la key no haya expirado
- Genera una nueva API key si es necesario
- Verifica que la key no haya sido revocada

### Error: "Duración no válida"
- Usa solo las duraciones permitidas: `1h`, `24h`, `7d`, `30d`