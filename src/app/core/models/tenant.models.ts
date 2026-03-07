export interface TenantDto {
  id: string;
  nombreComercial: string;
  ruc: string;
  logoUrl: string;
  colorPrimario: string;
  faviconUrl: string;
}

export interface CrearTenantRequest {
  nombreComercial: string;
  ruc: string;
  logoUrl: string;
  colorPrimario: string;
  faviconUrl: string;
}
