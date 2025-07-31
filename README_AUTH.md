# Módulo de Autenticación - API Gateway GraphQL

## Descripción
Este módulo implementa la integración con el microservicio de autenticación a través de GraphQL, proporcionando un punto de entrada unificado para las operaciones de autenticación.

## Estructura del Módulo

```
src/auth/
├── dto/
│   ├── login.input.ts          # Input type para login
│   └── auth-response.type.ts    # Response types para autenticación
├── auth.service.ts              # Servicio que se comunica con el microservicio
├── auth.resolver.ts             # Resolver GraphQL
└── auth.module.ts               # Módulo de autenticación
```

## Configuración

### Variables de Entorno
El proyecto ya cuenta con un archivo `.env` configurado con las variables necesarias:

```env
AUTH_URL=https://learning-apibank.cloud/api/v1/auth/
API_KEY=tu-api-key
JWT_SECRET=tu-jwt-secret
PORT=4000
```

El módulo de autenticación utiliza la variable `AUTH_URL` para comunicarse con el microservicio.

## Operaciones GraphQL Disponibles

### 1. Login
**Mutation:**
```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    refreshToken
    expiresIn
    tokenType
    userId
    message
  }
}
```

**Variables:**
```json
{
  "input": {
    "identificationType": "CC",
    "identificationNumber": "12345678",
    "password": "password123"
  }
}
```

### 2. Refresh Token
**Mutation:**
```graphql
mutation RefreshToken($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken) {
    token
    refreshToken
    expiresIn
    tokenType
    userId
    message
  }
}
```

**Variables:**
```json
{
  "refreshToken": "your-refresh-token-here"
}
```

## Uso

### 1. Iniciar el servidor
```bash
npm run start:dev
```

### 2. Acceder al GraphQL Playground
Navega a: `http://localhost:3000/graphql`

### 3. Probar las mutaciones
Utiliza el playground para probar las operaciones de autenticación.

## Integración con el Microservicio

El módulo se comunica con el microservicio de autenticación a través de HTTP REST:

- **Endpoint de Login:** `POST /auth/login`
- **Endpoint de Validación:** `GET /auth/validate`
- **Endpoint de Refresh:** `POST /auth/refresh`

## Manejo de Errores

El módulo maneja los siguientes tipos de errores:

- **401 Unauthorized:** Credenciales inválidas
- **500 Internal Server Error:** Errores de comunicación con el microservicio
- **Validación:** Errores de validación de entrada

## Próximos Pasos

1. **Implementar Guards de Autenticación:** Para proteger otros resolvers
2. **Agregar más operaciones:** Registro, cambio de contraseña, etc.
3. **Implementar caché:** Para tokens y validaciones frecuentes
4. **Agregar logging:** Para auditoría y debugging

## Documentación del Microservicio

Puedes consultar la documentación completa del microservicio en:
[https://learning-apibank.cloud/auth-docs/swagger-ui/index.html](https://learning-apibank.cloud/auth-docs/swagger-ui/index.html)