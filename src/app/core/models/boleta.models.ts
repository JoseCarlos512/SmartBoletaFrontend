export type BoletaEstado = 'Pendiente' | 'ProcesandoOcr' | 'Disponible' | 'Firmada';

export interface BoletaDto {
  id: string;
  tenantId: string;
  usuarioId: string;
  periodo: string;
  archivoNombre: string;
  archivoUrl: string;
  estado: BoletaEstado;
  textoOcr: string | null;
  fechaSubida: string;
  fechaFirma: string | null;
}

// Carga masiva
export type CargaMasivaEstado = 'Pendiente' | 'EnProceso' | 'Completada' | 'CompletadaConErrores';
export type CargaMasivaArchivoEstado = 'Procesando' | 'Asignado' | 'Fallido';

export interface CargaMasivaArchivoDto {
  id: string;
  nombreArchivo: string;
  estado: CargaMasivaArchivoEstado;
  razonFallo: string | null;
  boletaId: string | null;
  usuarioNombre: string | null;
}

export interface CargaMasivaDto {
  id: string;
  estado: CargaMasivaEstado;
  periodo: string;
  total: number;
  procesados: number;
  exitosos: number;
  fallidos: number;
  archivos: CargaMasivaArchivoDto[];
  fechaCreacion: string;
  fechaFinalizacion: string | null;
}

export interface CargaMasivaIniciadaResponse {
  cargaMasivaId: string;
}
