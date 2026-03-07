import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BoletaDto } from '../models/boleta.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BoletaService {
  private readonly base = `${environment.apiUrl}/api/boletas`;

  constructor(private http: HttpClient) {}

  getById(id: string) {
    return this.http.get<BoletaDto>(`${this.base}/${id}`);
  }

  getByUsuario(usuarioId: string) {
    return this.http.get<BoletaDto[]>(`${this.base}/usuario/${usuarioId}`);
  }

  getByTenant(pagina = 1, tamanoPagina = 20) {
    return this.http.get<BoletaDto[]>(`${this.base}/tenant`, {
      params: { pagina, tamanoPagina },
    });
  }

  subir(usuarioId: string, periodo: string, archivo: File) {
    const form = new FormData();
    form.append('usuarioId', usuarioId);
    form.append('periodo', periodo);
    form.append('archivo', archivo);
    return this.http.post<BoletaDto>(this.base, form);
  }

  firmar(id: string) {
    return this.http.put<void>(`${this.base}/${id}/firmar`, null);
  }
}
