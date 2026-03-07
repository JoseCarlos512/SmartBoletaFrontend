# CLAUDE.md — SmartBoleta Frontend

This file provides guidance to Claude Code when working with this Angular frontend.

## Commands

```bash
# Dev server
ng serve

# Build development
ng build --configuration development

# Build production
ng build

# Run tests
ng test
```

Frontend runs at `http://localhost:4200`. Backend URL configured in `src/environments/environment.ts`.

## Stack

- **Angular 21** — standalone components, signals, control flow (`@if`, `@for`, `@else`)
- **Angular Material 21** — UI components
- **@microsoft/signalr** — real-time notifications
- **HttpClient** with functional interceptors (`HttpInterceptorFn`)

## Project Structure

```
src/app/
  core/
    auth/
      auth.service.ts        # login, logout, token, currentUser signal, isTokenExpired
      auth.guard.ts          # CanActivateFn — verifica token válido
      role.guard.ts          # CanActivateFn — verifica route.data.roles
    interceptors/
      jwt.interceptor.ts     # agrega Authorization: Bearer a todo excepto /api/Auth/login
      error.interceptor.ts   # redirige a /login en 401
    services/
      tenant.service.ts
      usuario.service.ts
      boleta.service.ts
      signalr.service.ts     # connect/disconnect, boletaProcesada$, boletaFirmada$
    models/
      auth.models.ts · tenant.models.ts · usuario.models.ts · boleta.models.ts
  features/
    auth/login/              LoginComponent
    dashboard/               DashboardComponent — contadores de boletas por estado
    boletas/
      boleta-list/           tabla + chips de estado + refresco automático por SignalR
      subir-boleta/          form multipart/form-data (solo Admin/Manager)
      boleta-detail/         stepper visual de estados + botón firmar
    usuarios/                tabla + dialog inline para crear (Admin/Manager)
    tenants/                 tabla + dialog inline para crear (solo Admin)
  shared/
    pipes/boleta-estado.pipe.ts
    components/navbar/navbar.component.ts
  app.ts           # bootstrap — conecta SignalR si hay sesión activa
  app.config.ts    # providers: router, httpClient+interceptors, animationsAsync
  app.routes.ts    # lazy loading en todas las rutas
src/environments/
  environment.ts       # apiUrl: https://localhost:7001
  environment.prod.ts
```

## Key Patterns

**Auth state** — `AuthService` usa `signal<LoginResponse | null>`. El token se guarda en `localStorage` con la key `sb_token` como JSON del `LoginResponse` completo. El `tenantId` y `rol` se leen directamente del `LoginResponse`, no se decodifica el JWT.

**Interceptors funcionales** — usar `HttpInterceptorFn`, registrar en `appConfig` con `withInterceptors([jwtInterceptor, errorInterceptor])`.

**Guards funcionales** — usar `CanActivateFn`. Roles en `route.data['roles']`. Rutas de Admin/Manager deben incluir `canActivate: [authGuard, roleGuard]`.

**SignalR** — conectar en login y al iniciar la app si hay sesión. Token se pasa via `accessTokenFactory`. Al recibir `boleta_procesada` o `boleta_firmada`, recargar la lista de boletas.

**Upload de boleta** — usar `FormData`, campos: `usuarioId`, `periodo`, `archivo`. NO usar JSON.

**Standalone components** — siempre `standalone: true`. Importar explícitamente cada módulo de Material (`MatTableModule`, `MatButtonModule`, etc.) y `NgClass`, `DatePipe`, etc. desde `@angular/common`.

## Gotchas

- `[ngClass]` en standalone components requiere importar `NgClass` de `@angular/common`.
- `mat-divider` requiere importar `MatDividerModule`.
- `@angular/animations` debe instalarse por separado (`npm install @angular/animations`).
- En bloques `@else` con múltiples nodos (ej. `<mat-icon> + texto`), envolver en `<ng-container>` para evitar NG8011.
- Los enums del backend vienen como strings (`"Disponible"`, no `2`).
- Todos los IDs son GUIDs en formato string.

## Backend API (referencia rápida)

| Método | Endpoint | Roles |
|---|---|---|
| POST | `/api/Auth/login` | público |
| GET/POST | `/api/tenants` | Admin |
| GET/POST | `/api/usuarios` | Admin (POST), Admin+Manager (GET) |
| GET | `/api/boletas/{id}` | autenticado |
| GET | `/api/boletas/usuario/{usuarioId}` | autenticado |
| GET | `/api/boletas/tenant` | Admin, Manager |
| POST | `/api/boletas` | Admin, Manager |
| PUT | `/api/boletas/{id}/firmar` | propietario de la boleta |

SignalR hub: `/hubs/notificaciones` — eventos: `boleta_procesada`, `boleta_firmada`.
