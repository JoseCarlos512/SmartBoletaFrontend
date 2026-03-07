import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UsuarioDto, CrearUsuarioRequest } from '../models/usuario.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly base = `${environment.apiUrl}/api/usuarios`;

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<UsuarioDto[]>(this.base);
  }

  getById(id: string) {
    return this.http.get<UsuarioDto>(`${this.base}/${id}`);
  }

  create(request: CrearUsuarioRequest) {
    return this.http.post<UsuarioDto>(this.base, request);
  }
}
