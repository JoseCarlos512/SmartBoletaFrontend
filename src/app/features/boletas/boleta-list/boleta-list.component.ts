import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { BoletaService } from '../../../core/services/boleta.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { BoletaDto, BoletaEstado } from '../../../core/models/boleta.models';
import { BoletaEstadoPipe } from '../../../shared/pipes/boleta-estado.pipe';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-boleta-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCardModule,
    DatePipe,
    NgClass,
    BoletaEstadoPipe,
    NavbarComponent,
  ],
  template: `
    <app-navbar></app-navbar>
    <div class="container">
      <div class="header">
        <h1>Boletas</h1>
        @if (auth.hasRole('Admin', 'Manager')) {
          <a mat-raised-button color="primary" routerLink="/boletas/subir">
            <mat-icon>upload_file</mat-icon> Subir boleta
          </a>
        }
      </div>

      @if (loading()) {
        <div class="center"><mat-spinner></mat-spinner></div>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="boletas()" class="full-width">
            <ng-container matColumnDef="periodo">
              <th mat-header-cell *matHeaderCellDef>Periodo</th>
              <td mat-cell *matCellDef="let b">{{ b.periodo }}</td>
            </ng-container>

            <ng-container matColumnDef="archivoNombre">
              <th mat-header-cell *matHeaderCellDef>Archivo</th>
              <td mat-cell *matCellDef="let b">{{ b.archivoNombre }}</td>
            </ng-container>

            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let b">
                <mat-chip [ngClass]="'chip-' + b.estado.toLowerCase()">
                  {{ b.estado | boletaEstado }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="fechaSubida">
              <th mat-header-cell *matHeaderCellDef>Subida</th>
              <td mat-cell *matCellDef="let b">{{ b.fechaSubida | date:'dd/MM/yyyy HH:mm' }}</td>
            </ng-container>

            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let b">
                <a mat-icon-button [routerLink]="['/boletas', b.id]" matTooltip="Ver detalle">
                  <mat-icon>visibility</mat-icon>
                </a>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" [attr.colspan]="cols.length" style="text-align:center;padding:24px">
                No hay boletas
              </td>
            </tr>
          </table>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .container { padding: 24px; max-width: 1100px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .center { display: flex; justify-content: center; padding: 48px; }
    .chip-pendiente { background: #fff3e0 !important; color: #e65100 !important; }
    .chip-procesandoocr { background: #e3f2fd !important; color: #0d47a1 !important; }
    .chip-disponible { background: #e8f5e9 !important; color: #1b5e20 !important; }
    .chip-firmada { background: #f3e5f5 !important; color: #4a148c !important; }
  `],
})
export class BoletaListComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private boletaService = inject(BoletaService);
  private signalr = inject(SignalrService);

  cols = ['periodo', 'archivoNombre', 'estado', 'fechaSubida', 'acciones'];
  boletas = signal<BoletaDto[]>([]);
  loading = signal(true);

  private subs = new Subscription();

  ngOnInit() {
    this.loadBoletas();

    this.subs.add(
      this.signalr.boletaProcesada$.subscribe(() => this.loadBoletas())
    );
    this.subs.add(
      this.signalr.boletaFirmada$.subscribe(() => this.loadBoletas())
    );
    this.subs.add(
      this.signalr.cargaMasivaCompletada$.subscribe(() => this.loadBoletas())
    );
  }

  loadBoletas() {
    const user = this.auth.currentUser();
    if (!user) return;

    const obs = this.auth.hasRole('Admin', 'Manager')
      ? this.boletaService.getByTenant()
      : this.boletaService.getByUsuario(user.usuarioId);

    obs.subscribe({
      next: (b) => { this.boletas.set(b); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
