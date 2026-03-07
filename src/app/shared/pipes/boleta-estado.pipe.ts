import { Pipe, PipeTransform } from '@angular/core';
import { BoletaEstado } from '../../core/models/boleta.models';

@Pipe({ name: 'boletaEstado', standalone: true })
export class BoletaEstadoPipe implements PipeTransform {
  transform(estado: BoletaEstado): string {
    const map: Record<BoletaEstado, string> = {
      Pendiente: 'Pendiente',
      ProcesandoOcr: 'Procesando OCR',
      Disponible: 'Disponible',
      Firmada: 'Firmada',
    };
    return map[estado] ?? estado;
  }
}
