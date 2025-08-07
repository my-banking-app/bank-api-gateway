# CLAUDE.md

Este archivo proporciona orientación para Claude Code (claude.ai/code) al trabajar con código en este repositorio.

## Comandos Comunes

El proyecto utiliza pnpm como gestor de paquetes. Comandos clave de desarrollo:

- `pnpm install` - Instalar dependencias
- `pnpm run start:dev` - Iniciar en modo desarrollo con hot reload
- `pnpm run build` - Compilar la aplicación
- `pnpm run start:prod` - Iniciar en modo producción
- `pnpm run lint` - Ejecutar ESLint con auto-corrección
- `pnpm run format` - Formatear código con Prettier
- `pnpm run test` - Ejecutar tests unitarios
- `pnpm run test:watch` - Ejecutar tests en modo watch
- `pnpm run test:cov` - Ejecutar tests con cobertura
- `pnpm run test:e2e` - Ejecutar tests end-to-end

## Arquitectura

Es un API Gateway GraphQL basado en NestJS para un sistema bancario que actúa como proxy hacia múltiples microservicios.

### Estructura Central

- **GraphQL Gateway**: Utiliza Apollo Server con schema auto-generado en `/graphql`
- **Basado en módulos**: Cada dominio tiene su propio módulo (auth, health)
- **Comunicación HTTP**: Usa Axios para comunicarse con microservicios downstream
- **Configuración**: Configuración basada en variables de entorno con `@nestjs/config`

### Módulos Principales

1. **AuthModule** (`src/auth/`): Maneja operaciones de autenticación
   - Se comunica con el microservicio de auth vía REST
   - Provee mutations GraphQL para login y refresh de tokens
   - Utiliza JWT tokens y API keys para autenticación

2. **HealthModule** (`src/health/`): Monitoreo de salud del sistema
   - Proporciona estado de salud vía queries GraphQL
   - Retorna uptime del sistema, versión e información del entorno

### Variables de Entorno

Variables de entorno requeridas (configuradas en docker-compose.yml):
- `PORT` - Puerto del servidor (por defecto: 3000)
- `API_KEY` - API key para autenticación con microservicios
- `JWT_SECRET` - Secret JWT para validación de tokens
- `AUTH_URL` - URL del microservicio de autenticación
- `ACCOUNTS_URL` - URL del microservicio de cuentas
- `TRANSACTIONS_URL` - URL del microservicio de transacciones
- `PAYMENTS_URL` - URL del microservicio de pagos
- `CARDS_URL` - URL del microservicio de tarjetas

### Schema GraphQL

El schema se auto-genera en `schema.gql`. El playground está disponible en `/graphql` durante desarrollo.

### Testing

- Tests unitarios usan Jest con `ts-jest`
- Tests E2E están configurados con config separado de Jest
- Coverage excluye archivos de módulos y main.ts

### Docker

La aplicación está containerizada y configurada para ejecutarse en el puerto 4000 del contenedor (mapeado desde puerto del host en docker-compose).