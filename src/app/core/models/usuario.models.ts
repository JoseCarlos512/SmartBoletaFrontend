export interface UsuarioDto {
  id: string;
  tenantId: string;
  nombre: string;
  correo: string | null;
  dni: string;
  estado: boolean;
}

export interface CrearUsuarioRequest {
  nombre: string;
  correo: string;
  dni: string;
  password: string;
  rol?: string;
}
