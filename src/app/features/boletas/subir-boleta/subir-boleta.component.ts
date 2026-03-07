import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BoletaService } from '../../../core/services/boleta.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { UsuarioDto } from '../../../core/models/usuario.models';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-subir-boleta',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    NavbarComponent,
  ],
  template: `
    <app-navbar></app-navbar>
    <div class="container">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>Subir boleta</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Usuario</mat-label>
              <mat-select formControlName="usuarioId">
                @for (u of usuarios(); track u.id) {
                  <mat-option [value]="u.id">{{ u.nombre }} ({{ u.dni }})</mat-option>
                }
              </mat-select>
              @if (form.get('usuarioId')?.hasError('required') && form.get('usuarioId')?.touched) {
                <mat-error>Selecciona un usuario</mat-error>
              }
            </mat-form-field>

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
                <mat-icon>attach_file</mat-icon>
                {{ selectedFile() ? selectedFile()!.name : 'Seleccionar PDF' }}
              </button>
              <input #fileInput type="file" accept=".pdf" hidden (change)="onFileChange($event)" />
              @if (!selectedFile() && fileTouched) {
                <mat-error>Selecciona un archivo PDF</mat-error>
              }
            </div>

            @if (errorMessage) {
              <p class="error-msg">{{ errorMessage }}</p>
            }

            <div class="actions">
              <a mat-button routerLink="/boletas">Cancelar</a>
              <button mat-raised-button color="primary" type="submit" [disabled]="loading()">
                @if (loading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Subir
                }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { padding: 24px; max-width: 600px; margin: 0 auto; }
    .form-card { padding: 8px; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .file-area { margin-bottom: 16px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
    .error-msg { color: #f44336; font-size: 0.875rem; }
    mat-error { font-size: 0.75rem; margin-top: 4px; display: block; }
  `],
})
export class SubirBoletaComponent {
  private fb = inject(FormBuilder);
  private boletaService = inject(BoletaService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  form = this.fb.group({
    usuarioId: ['', Validators.required],
    periodo: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)]],
  });

  usuarios = signal<UsuarioDto[]>([]);
  selectedFile = signal<File | null>(null);
  loading = signal(false);
  fileTouched = false;
  errorMessage = '';

  constructor() {
    this.usuarioService.getAll().subscribe({ next: (u) => this.usuarios.set(u) });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
  }

  onSubmit() {
    this.fileTouched = true;
    if (this.form.invalid || !this.selectedFile()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage = '';
    const { usuarioId, periodo } = this.form.value;

    this.boletaService.subir(usuarioId!, periodo!, this.selectedFile()!).subscribe({
      next: () => {
        this.snackBar.open('Boleta subida correctamente', 'OK', { duration: 3000 });
        this.router.navigate(['/boletas']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage = err?.error?.error ?? 'Error al subir la boleta.';
      },
    });
  }
}
