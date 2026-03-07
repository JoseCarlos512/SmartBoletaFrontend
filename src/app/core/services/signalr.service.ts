import { Injectable, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

export interface BoletaProcesadaEvent {
  boletaId: string;
  estado: string;
  periodo: string;
}

export interface BoletaFirmadaEvent {
  id: string;
  periodo: string;
}

@Injectable({ providedIn: 'root' })
export class SignalrService implements OnDestroy {
  private connection: signalR.HubConnection | null = null;

  readonly boletaProcesada$ = new Subject<BoletaProcesadaEvent>();
  readonly boletaFirmada$ = new Subject<BoletaFirmadaEvent>();

  constructor(private auth: AuthService) {}

  async connect() {
    const token = this.auth.token();
    if (!token) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/hubs/notificaciones`, {
        accessTokenFactory: () => this.auth.token() ?? '',
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('boleta_procesada', (data: BoletaProcesadaEvent) => {
      this.boletaProcesada$.next(data);
    });

    this.connection.on('boleta_firmada', (data: BoletaFirmadaEvent) => {
      this.boletaFirmada$.next(data);
    });

    await this.connection.start();

    const tenantId = this.auth.tenantId();
    if (tenantId) {
      await this.connection.invoke('UnirseATenant', tenantId);
    }
  }

  async disconnect() {
    if (!this.connection) return;
    const tenantId = this.auth.tenantId();
    if (tenantId) {
      await this.connection.invoke('SalirDeTenant', tenantId).catch(() => {});
    }
    await this.connection.stop();
    this.connection = null;
  }

  ngOnDestroy() {
    this.disconnect();
  }
}
