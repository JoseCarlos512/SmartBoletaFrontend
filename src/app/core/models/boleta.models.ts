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
