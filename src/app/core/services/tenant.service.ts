import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TenantDto, CrearTenantRequest } from '../models/tenant.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly base = `${environment.apiUrl}/api/tenants`;

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<TenantDto[]>(this.base);
  }

  getById(id: string) {
    return this.http.get<TenantDto>(`${this.base}/${id}`);
  }

  create(request: CrearTenantRequest) {
    return this.http.post<TenantDto>(this.base, request);
  }
}
