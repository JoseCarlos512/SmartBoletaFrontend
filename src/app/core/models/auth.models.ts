export interface LoginRequest {
  correo: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  usuarioId: string;
  tenantId: string;
  nombre: string;
  correo: string;
  rol: 'Admin' | 'Manager' | 'User';
}

export interface TokenPayload {
  sub: string;
  tenantId: string;
  email: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string;
  exp: number;
}
