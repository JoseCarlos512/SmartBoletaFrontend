Contexto para el proyecto SmartBoleta Frontend (Angular)

  Sobre el proyecto

  Plataforma SmartBoleta — gestión y distribución de boletas digitales (PDFs). El backend es .NET 9 con Clean
  Architecture. El frontend debe integrarse completamente con sus APIs, JWT y SignalR.

  ---
  Base URL del backend

  https://localhost:7xxx   ← ajustar según el puerto que levante dotnet run
  Swagger disponible en /swagger/index.html en Development.

  ---
  Autenticación

  - JWT Bearer — el token se obtiene en el login y debe enviarse en todas las requests como Authorization: Bearer
  <token>
  - El token incluye los claims: sub (userId), tenantId, email,
  http://schemas.microsoft.com/ws/2008/06/identity/claims/role
  - Roles: Admin, Manager, User
  - Al expirar el token (campo expiresAt en el login response), redirigir al login

  ---
  Endpoints del backend

  Auth

  POST /api/Auth/login
  Body: { correo: string, password: string }
  Response: {
    token: string,
    expiresAt: string (ISO date),
    usuarioId: string (GUID),
    tenantId: string (GUID),
    nombre: string,
    correo: string,
    rol: string   // "Admin" | "Manager" | "User"
  }

  Tenants — solo rol Admin

  GET    /api/tenants          → TenantDto[]
  GET    /api/tenants/{id}     → TenantDto
  POST   /api/tenants          Body: CrearTenantRequest
  interface TenantDto {
    id: string;
    nombreComercial: string;
    ruc: string;
    logoUrl: string;
    colorPrimario: string;
    faviconUrl: string;
  }
  interface CrearTenantRequest {
    nombreComercial: string;
    ruc: string;
    logoUrl: string;
    colorPrimario: string;
    faviconUrl: string;
  }

  Usuarios

  GET  /api/usuarios           → UsuarioDto[]  (Admin, Manager)
  GET  /api/usuarios/{id}      → UsuarioDto    (cualquier autenticado)
  POST /api/usuarios           Body: CrearUsuarioRequest  (solo Admin)
  interface UsuarioDto {
    id: string;
    tenantId: string;
    nombre: string;
    correo: string | null;
    dni: string;
    estado: boolean;
  }
  interface CrearUsuarioRequest {
    nombre: string;
    correo: string;
    dni: string;
    password: string;
    rol?: string;   // default "User"
  }

  Boletas

  GET  /api/boletas/{id}                       → BoletaDto  (autenticado)
  GET  /api/boletas/usuario/{usuarioId}        → BoletaDto[]  (autenticado, filtra por TenantId del token)
  GET  /api/boletas/tenant?pagina=1&tamanoPagina=20  → BoletaDto[]  (Admin, Manager)
  POST /api/boletas              multipart/form-data  (Admin, Manager)
  PUT  /api/boletas/{id}/firmar  sin body  (autenticado, solo puede firmar sus propias boletas)
  type BoletaEstado = 'Pendiente' | 'ProcesandoOcr' | 'Disponible' | 'Firmada';

  interface BoletaDto {
    id: string;
    tenantId: string;
    usuarioId: string;
    periodo: string;       // formato "YYYY-MM"
    archivoNombre: string;
    archivoUrl: string;
    estado: BoletaEstado;  // enum serializado como string
    textoOcr: string | null;
    fechaSubida: string;   // ISO date
    fechaFirma: string | null;
  }
  El upload de boleta es multipart/form-data con los campos:
  - usuarioId (GUID)
  - periodo (string, formato YYYY-MM)
  - archivo (File — PDF)

  Respuestas de error

  - 400 con body { errors: { [campo]: string[] } } para errores de validación
  - 401 para no autenticado
  - 403 para sin permisos
  - 404 para no encontrado con { code: string, message: string }
  - 500 con { error: string }

  ---
  SignalR

  Hub URL: /hubs/notificaciones
  JWT: pasar como query string ?access_token=<token>  (necesario para WebSocket)
  Métodos que el cliente debe invocar:
  - UnirseATenant(tenantId: string) — unirse al grupo del tenant al conectar
  - SalirDeTenant(tenantId: string) — al desconectar

  Eventos que el cliente debe escuchar:
  - boleta_procesada — payload: { boletaId, estado, periodo } — cuando el OCR termina
  - boleta_firmada — payload: { id, periodo } — cuando una boleta se firma

  ---
  Stack y requisitos técnicos

  - Angular 17+ con standalone components
  - Angular Material para UI
  - @microsoft/signalr para la conexión al hub
  - HttpClient con interceptors para JWT y manejo de errores
  - Manejo de roles: ocultar/mostrar elementos según rol del usuario logueado
  - El tenantId del usuario viene dentro del JWT — extráerlo del token decodificado, no almacenarlo por separado
  - Guardar el token en localStorage (o sessionStorage según tu criterio)
  - Al recibir boleta_procesada via SignalR, refrescar la lista de boletas automáticamente

  ---
  Estructura sugerida

  src/app/
    core/
      auth/
        auth.service.ts          # login, logout, token, user signal
        auth.guard.ts
        role.guard.ts
      interceptors/
        jwt.interceptor.ts       # agrega Authorization header
        error.interceptor.ts     # maneja 401 → redirect login
      services/
        tenant.service.ts
        usuario.service.ts
        boleta.service.ts
        signalr.service.ts       # conexión hub, eventos reactivos
      models/
        auth.models.ts
        tenant.models.ts
        usuario.models.ts
        boleta.models.ts
    features/
      auth/login/
      dashboard/
      boletas/
        boleta-list/             # lista + filtros + estado en chips
        subir-boleta/            # form con file upload
        boleta-detail/           # detalle + botón firmar
      usuarios/
        usuario-list/
      tenants/
        tenant-list/             # solo Admin
    shared/
      components/navbar/
      pipes/boleta-estado.pipe.ts
    app.config.ts
    app.routes.ts

  ---
  Notas importantes para la implementación

  1. El interceptor JWT debe adjuntar Authorization: Bearer <token> a todas las requests excepto POST /api/Auth/login.
  2. SignalR requiere el token como query param ?access_token= porque los WebSockets no pueden enviar headers HTTP. Usar
   withUrl('/hubs/notificaciones', { accessTokenFactory: () => token }).
  3. Rol Guard — las rutas de Admin/Manager deben verificar el rol del usuario antes de activarse.
  4. Upload de boleta — usar FormData, no JSON. El campo del archivo se llama archivo.
  5. Estados de boleta — mostrar el flujo Pendiente → ProcesandoOcr → Disponible → Firmada visualmente (ej. stepper o
  chips con colores).
  6. tenantId — se extrae del claim del JWT decodificado. La API lo usa internamente desde el token, no hay que enviarlo
   en el body de las requests protegidas.
  7. Los enums del backend se serializan como strings ("Disponible", no 2).
  8. Todos los IDs son GUID en formato string.