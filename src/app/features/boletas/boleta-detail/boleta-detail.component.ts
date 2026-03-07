import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { BoletaService } from '../../../core/services/boleta.service';
import { AuthService } from '../../../core/auth/auth.service';
import { BoletaDto } from '../../../core/models/boleta.models';
import { BoletaEstadoPipe } from '../../../shared/pipes/boleta-estado.pipe';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-boleta-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    NgClass,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatSnackBarModule,
    MatDividerModule,
    BoletaEstadoPipe,
    NavbarComponent,
  ],
  template: `
    <app-navbar></app-navbar>
    <div class="container">
      @if (loading()) {
        <div class="center"><mat-spinner></mat-spinner></div>
      } @else if (boleta()) {
        <div class="header">
          <h1>Boleta — {{ boleta()!.periodo }}</h1>
          <mat-chip [ngClass]="'chip-' + boleta()!.estado.toLowerCase()">
            {{ boleta()!.estado | boletaEstado }}
          </mat-chip>
        </div>

        <!-- Flujo visual de estados -->
        <mat-card class="stepper-card">
          <mat-card-content>
            <mat-stepper [selectedIndex]="stepIndex()">
              <mat-step label="Pendiente" state="pendiente"></mat-step>
              <mat-step label="Procesando OCR" state="procesando"></mat-step>
              <mat-step label="Disponible" state="disponible"></mat-step>
              <mat-step label="Firmada" state="firmada"></mat-step>
            </mat-stepper>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Archivo</span>
                <span>{{ boleta()!.archivoNombre }}</span>
              </div>
              <div class="info-item">
                <span class="label">Subida</span>
                <span>{{ boleta()!.fechaSubida | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              @if (boleta()!.fechaFirma) {
                <div class="info-item">
                  <span class="label">Firmada</span>
                  <span>{{ boleta()!.fechaFirma | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              }
            </div>

            @if (boleta()!.textoOcr) {
              <mat-divider class="divider"></mat-divider>
              <h3>Texto OCR</h3>
              <pre class="ocr-text">{{ boleta()!.textoOcr }}</pre>
            }
          </mat-card-content>

          <mat-card-actions>
            <a mat-button routerLink="/boletas">
              <mat-icon>arrow_back</mat-icon> Volver
            </a>
            @if (puedeFirmar()) {
              <button mat-raised-button color="accent" (click)="firmar()" [disabled]="firmando()">
                @if (firmando()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <ng-container><mat-icon>draw</mat-icon> Firmar boleta</ng-container>
                }
              </button>
            }
            <a mat-button [href]="boleta()!.archivoUrl" target="_blank">
              <mat-icon>open_in_new</mat-icon> Ver PDF
            </a>
          </mat-card-actions>
        </mat-card>
      } @else {
        <p>Boleta no encontrada.</p>
        <a mat-button routerLink="/boletas">Volver</a>
      }
    </div>
  `,
  styles: [`
    .container { padding: 24px; max-width: 800px; margin: 0 auto; }
    .center { display: flex; justify-content: center; padding: 48px; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    h1 { margin: 0; }
    .stepper-card { margin-bottom: 16px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-item { display: flex; flex-direction: column; }
    .label { font-size: 0.75rem; color: #666; text-transform: uppercase; margin-bottom: 4px; }
    .divider { margin: 16px 0; }
    .ocr-text { background: #f5f5f5; padding: 12px; border-radius: 4px; overflow: auto; font-size: 0.875rem; white-space: pre-wrap; }
    .chip-pendiente { background: #fff3e0 !important; color: #e65100 !important; }
    .chip-procesandoocr { background: #e3f2fd !important; color: #0d47a1 !important; }
    .chip-disponible { background: #e8f5e9 !important; color: #1b5e20 !important; }
    .chip-firmada { background: #f3e5f5 !important; color: #4a148c !important; }
  `],
})
export class BoletaDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private boletaService = inject(BoletaService);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  boleta = signal<BoletaDto | null>(null);
  loading = signal(true);
  firmando = signal(false);

  readonly ESTADOS = ['Pendiente', 'ProcesandoOcr', 'Disponible', 'Firmada'];

  stepIndex() {
    return this.ESTADOS.indexOf(this.boleta()?.estado ?? 'Pendiente');
  }

  puedeFirmar() {
    const b = this.boleta();
    const user = this.auth.currentUser();
    return b?.estado === 'Disponible' && b?.usuarioId === user?.usuarioId;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.boletaService.getById(id).subscribe({
      next: (b) => { this.boleta.set(b); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  firmar() {
    const id = this.boleta()?.id;
    if (!id) return;

    this.firmando.set(true);
    this.boletaService.firmar(id).subscribe({
      next: () => {
        this.snackBar.open('Boleta firmada', 'OK', { duration: 3000 });
        this.boletaService.getById(id).subscribe({ next: (b) => this.boleta.set(b) });
        this.firmando.set(false);
      },
      error: (err) => {
        this.firmando.set(false);
        this.snackBar.open(err?.error?.error ?? 'No se pudo firmar', 'OK', { duration: 3000 });
      },
    });
  }
}
