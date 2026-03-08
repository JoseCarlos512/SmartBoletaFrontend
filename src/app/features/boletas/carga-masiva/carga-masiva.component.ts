import { Component, inject, signal, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { interval, Subject, Subscription } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BoletaService } from '../../../core/services/boleta.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { CargaMasivaDto } from '../../../core/models/boleta.models';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

type Fase = 'form' | 'procesando' | 'resultado';

@Component({
  selector: 'app-carga-masiva',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    NgClass,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    NavbarComponent,
  ],
  template: `
    <app-navbar></app-navbar>
    <div class="container">

      @if (fase() === 'form') {
        <mat-card class="main-card">
          <mat-card-header>
            <mat-card-title>Carga masiva de boletas</mat-card-title>
            <mat-card-subtitle>
              Sube múltiples PDFs. El sistema identificará al usuario por DNI o nombre.
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Periodo (YYYY-MM)</mat-label>
                <input matInput formControlName="periodo" placeholder="2024-01" />
                @if (form.get('periodo')?.hasError('required') && form.get('periodo')?.touched) {
                  <mat-error>El periodo es requerido</mat-error>
                }
                @if (form.get('periodo')?.hasError('pattern') && form.get('periodo')?.touched) {
                  <mat-error>Formato: YYYY-MM</mat-error>
                }
              </mat-form-field>

              <div class="file-area">
                <button mat-stroked-button type="button" (click)="fileInput.click()">
                  <mat-icon>folder_open</mat-icon>
                  @if (archivos().length > 0) {
                    {{ archivos().length }} archivo(s) seleccionado(s)
                  } @else {
                    Seleccionar PDFs
                  }
                </button>
                <input #fileInput type="file" accept=".pdf" multiple hidden (change)="onFilesChange($event)" />
                @if (filesTouched && archivos().length === 0) {
                  <span class="file-error">Selecciona al menos un PDF</span>
                }
                @if (archivos().length > 0) {
                  <ul class="file-list">
                    @for (f of archivos(); track f.name) {
                      <li>
                        <mat-icon class="pdf-icon">picture_as_pdf</mat-icon>
                        <span>{{ f.name }}</span>
                      </li>
                    }
                  </ul>
                }
              </div>

              @if (errorMessage()) {
                <p class="error-msg">{{ errorMessage() }}</p>
              }

              <div class="actions">
                <a mat-button routerLink="/boletas">Cancelar</a>
                <button mat-raised-button color="primary" type="submit" [disabled]="uploading()">
                  @if (uploading()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    <mat-icon>cloud_upload</mat-icon> Iniciar carga
                  }
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      @if (fase() === 'procesando') {
        <mat-card class="main-card">
          <mat-card-header>
            <mat-card-title>Procesando boletas...</mat-card-title>
            @if (progreso(); as p) {
              <mat-card-subtitle>Periodo: {{ p.periodo }}</mat-card-subtitle>
            }
          </mat-card-header>
          <mat-card-content>
            @if (progreso(); as p) {
              <p class="progress-text">{{ p.procesados }} de {{ p.total }} archivos procesados</p>
              <mat-progress-bar
                mode="determinate"
                [value]="p.total > 0 ? (p.procesados / p.total) * 100 : 0"
              ></mat-progress-bar>
              <div class="progress-stats">
                <span class="stat-ok"><mat-icon>check_circle</mat-icon> {{ p.exitosos }} asignados</span>
                <span class="stat-err"><mat-icon>error</mat-icon> {{ p.fallidos }} fallidos</span>
              </div>
            } @else {
              <mat-progress-bar mode="indeterminate"></mat-progress-bar>
              <p class="progress-text">Iniciando proceso...</p>
            }
            <p class="hint">Los usuarios recibirán notificaciones al asignarse sus boletas.</p>
          </mat-card-content>
        </mat-card>
      }

      @if (fase() === 'resultado') {
        @if (progreso(); as p) {
          <div class="header">
            <h1>Carga masiva completada</h1>
            <button mat-raised-button color="primary" (click)="nuevaCarga()">
              <mat-icon>refresh</mat-icon> Nueva carga
            </button>
          </div>

          <div class="summary-chips">
            <mat-chip class="chip-ok">
              <mat-icon matChipAvatar>check_circle</mat-icon>
              {{ p.exitosos }} boletas asignadas
            </mat-chip>
            <mat-chip class="chip-err">
              <mat-icon matChipAvatar>error</mat-icon>
              {{ p.fallidos }} fallidos
            </mat-chip>
            <mat-chip>
              <mat-icon matChipAvatar>description</mat-icon>
              {{ p.total }} total
            </mat-chip>
          </div>

          <mat-card>
            <table mat-table [dataSource]="p.archivos" class="full-width">
              <ng-container matColumnDef="nombreArchivo">
                <th mat-header-cell *matHeaderCellDef>Archivo</th>
                <td mat-cell *matCellDef="let a">{{ a.nombreArchivo }}</td>
              </ng-container>

              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let a">
                  <mat-chip [ngClass]="'chip-archivo-' + a.estado.toLowerCase()">
                    {{ a.estado }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="usuarioNombre">
                <th mat-header-cell *matHeaderCellDef>Usuario</th>
                <td mat-cell *matCellDef="let a">{{ a.usuarioNombre ?? '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="razonFallo">
                <th mat-header-cell *matHeaderCellDef>Razón de fallo</th>
                <td mat-cell *matCellDef="let a">{{ a.razonFallo ?? '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="boleta">
                <th mat-header-cell *matHeaderCellDef>Boleta</th>
                <td mat-cell *matCellDef="let a">
                  @if (a.boletaId) {
                    <a mat-icon-button [routerLink]="['/boletas', a.boletaId]" matTooltip="Ver boleta">
                      <mat-icon>visibility</mat-icon>
                    </a>
                  } @else {
                    <span>—</span>
                  }
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="resultCols"></tr>
              <tr mat-row *matRowDef="let row; columns: resultCols"
                  [ngClass]="{ 'row-fallido': row.estado === 'Fallido' }"></tr>
            </table>
          </mat-card>
        }
      }

    </div>
  `,
  styles: [`
    .container { padding: 24px; max-width: 1000px; margin: 0 auto; }
    .main-card { padding: 8px; }
    .full-width { width: 100%; margin-bottom: 8px; }

    .file-area { margin-bottom: 16px; }
    .file-error { font-size: 0.75rem; color: #f44336; margin-top: 4px; display: block; }
    .file-list { list-style: none; padding: 8px 0; margin: 8px 0 0; max-height: 220px; overflow-y: auto; }
    .file-list li { display: flex; align-items: center; gap: 6px; font-size: 0.875rem; padding: 2px 0; }
    .pdf-icon { font-size: 18px; width: 18px; height: 18px; color: #e53935; }

    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
    .error-msg { color: #f44336; font-size: 0.875rem; }

    .progress-text { margin: 16px 0 8px; font-size: 1rem; }
    .progress-stats { display: flex; gap: 24px; margin-top: 12px; }
    .stat-ok { display: flex; align-items: center; gap: 4px; color: #2e7d32; }
    .stat-err { display: flex; align-items: center; gap: 4px; color: #c62828; }
    .hint { color: #757575; font-size: 0.85rem; margin-top: 16px; }

    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .summary-chips { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }

    .chip-ok { background: #e8f5e9 !important; color: #1b5e20 !important; }
    .chip-err { background: #ffebee !important; color: #b71c1c !important; }
    .chip-archivo-asignado { background: #e8f5e9 !important; color: #1b5e20 !important; }
    .chip-archivo-fallido { background: #ffebee !important; color: #b71c1c !important; }
    .chip-archivo-procesando { background: #e3f2fd !important; color: #0d47a1 !important; }
    .row-fallido td { background: #fff8f8; }
    .full-width { width: 100%; }
  `],
})
export class CargaMasivaComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private boletaService = inject(BoletaService);
  private signalr = inject(SignalrService);
  private snackBar = inject(MatSnackBar);

  form = this.fb.group({
    periodo: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)]],
  });

  fase = signal<Fase>('form');
  archivos = signal<File[]>([]);
  uploading = signal(false);
  errorMessage = signal('');
  progreso = signal<CargaMasivaDto | null>(null);
  filesTouched = false;

  resultCols = ['nombreArchivo', 'estado', 'usuarioNombre', 'razonFallo', 'boleta'];

  private pollingStop$ = new Subject<void>();
  private subs = new Subscription();

  onFilesChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.archivos.set(Array.from(input.files ?? []));
  }

  onSubmit() {
    this.filesTouched = true;
    if (this.form.invalid || this.archivos().length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.uploading.set(true);
    this.errorMessage.set('');

    this.boletaService.subirMasiva(this.form.value.periodo!, this.archivos()).subscribe({
      next: (resp) => {
        this.uploading.set(false);
        this.fase.set('procesando');
        this.startPolling(resp.cargaMasivaId);
        this.listenSignalR(resp.cargaMasivaId);
      },
      error: (err) => {
        this.uploading.set(false);
        this.errorMessage.set(err?.error?.error ?? 'Error al iniciar la carga masiva.');
      },
    });
  }

  private startPolling(id: string) {
    // Do an immediate fetch first, then every 3s
    this.boletaService.getCargaMasiva(id).subscribe({ next: (d) => this.onProgressUpdate(id, d) });

    this.subs.add(
      interval(3000).pipe(
        takeUntil(this.pollingStop$),
        switchMap(() => this.boletaService.getCargaMasiva(id)),
      ).subscribe({ next: (d) => this.onProgressUpdate(id, d) })
    );
  }

  private onProgressUpdate(id: string, data: CargaMasivaDto) {
    this.progreso.set(data);
    if (data.estado === 'Completada' || data.estado === 'CompletadaConErrores') {
      this.stopPolling();
      this.fase.set('resultado');
    }
  }

  private listenSignalR(id: string) {
    this.subs.add(
      this.signalr.cargaMasivaCompletada$.subscribe((event) => {
        if (event.cargaMasivaId !== id) return;
        this.stopPolling();
        this.boletaService.getCargaMasiva(id).subscribe({
          next: (data) => {
            this.progreso.set(data);
            this.fase.set('resultado');
          },
        });
      })
    );
  }

  private stopPolling() {
    this.pollingStop$.next();
  }

  nuevaCarga() {
    this.stopPolling();
    this.subs.unsubscribe();
    this.form.reset();
    this.archivos.set([]);
    this.progreso.set(null);
    this.filesTouched = false;
    this.fase.set('form');
  }

  ngOnDestroy() {
    this.stopPolling();
    this.subs.unsubscribe();
  }
}
