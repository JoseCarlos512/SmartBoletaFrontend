import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';
import { BoletaService } from '../../core/services/boleta.service';
import { BoletaDto } from '../../core/models/boleta.models';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="dashboard-container">
      <h1>Bienvenido, {{ auth.currentUser()?.nombre }}</h1>
      <p class="subtitle">Rol: <strong>{{ auth.rol() }}</strong></p>

      <div class="stats-grid">
        <mat-card>
          <mat-card-content>
            <div class="stat">
              <mat-icon class="stat-icon pendiente">hourglass_empty</mat-icon>
              <div>
                <div class="stat-value">{{ count('Pendiente') }}</div>
                <div class="stat-label">Pendientes</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content>
            <div class="stat">
              <mat-icon class="stat-icon procesando">sync</mat-icon>
              <div>
                <div class="stat-value">{{ count('ProcesandoOcr') }}</div>
                <div class="stat-label">Procesando OCR</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content>
            <div class="stat">
              <mat-icon class="stat-icon disponible">check_circle</mat-icon>
              <div>
                <div class="stat-value">{{ count('Disponible') }}</div>
                <div class="stat-label">Disponibles</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content>
            <div class="stat">
              <mat-icon class="stat-icon firmada">verified</mat-icon>
              <div>
                <div class="stat-value">{{ count('Firmada') }}</div>
                <div class="stat-label">Firmadas</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="actions">
        <a mat-raised-button color="primary" routerLink="/boletas">
          <mat-icon>description</mat-icon> Ver mis boletas
        </a>
        @if (auth.hasRole('Admin', 'Manager')) {
          <a mat-raised-button color="accent" routerLink="/boletas/subir">
            <mat-icon>upload_file</mat-icon> Subir boleta
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 24px; max-width: 1000px; margin: 0 auto; }
    h1 { margin-bottom: 4px; }
    .subtitle { color: #666; margin-bottom: 24px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat { display: flex; align-items: center; gap: 16px; }
    .stat-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; }
    .stat-value { font-size: 2rem; font-weight: 700; line-height: 1; }
    .stat-label { font-size: 0.875rem; color: #666; }
    .pendiente { color: #ff9800; }
    .procesando { color: #2196f3; }
    .disponible { color: #4caf50; }
    .firmada { color: #9c27b0; }
    .actions { display: flex; gap: 12px; flex-wrap: wrap; }
  `],
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private boletaService = inject(BoletaService);

  boletas = signal<BoletaDto[]>([]);

  ngOnInit() {
    const user = this.auth.currentUser();
    if (!user) return;

    if (this.auth.hasRole('Admin', 'Manager')) {
      this.boletaService.getByTenant().subscribe({ next: (b) => this.boletas.set(b) });
    } else {
      this.boletaService.getByUsuario(user.usuarioId).subscribe({ next: (b) => this.boletas.set(b) });
    }
  }

  count(estado: string) {
    return this.boletas().filter((b) => b.estado === estado).length;
  }
}
