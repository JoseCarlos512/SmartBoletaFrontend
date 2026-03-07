import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UsuarioService } from '../../../core/services/usuario.service';
import { UsuarioDto } from '../../../core/models/usuario.models';
import { AuthService } from '../../../core/auth/auth.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatProgressSpinnerModule, MatChipsModule, MatDialogModule,
    MatSnackBarModule, ReactiveFormsModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, NavbarComponent,
  ],
  template: `
    <app-navbar></app-navbar>
    <div class="container">
      <div class="header">
        <h1>Usuarios</h1>
        @if (auth.hasRole('Admin')) {
          <button mat-raised-button color="primary" (click)="openDialog()">
            <mat-icon>person_add</mat-icon> Nuevo usuario
          </button>
        }
      </div>

      @if (loading()) {
        <div class="center"><mat-spinner></mat-spinner></div>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="usuarios()" class="full-width">
            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let u">{{ u.nombre }}</td>
            </ng-container>
            <ng-container matColumnDef="correo">
              <th mat-header-cell *matHeaderCellDef>Correo</th>
              <td mat-cell *matCellDef="let u">{{ u.correo ?? '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="dni">
              <th mat-header-cell *matHeaderCellDef>DNI</th>
              <td mat-cell *matCellDef="let u">{{ u.dni }}</td>
            </ng-container>
            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let u">
                <mat-chip [color]="u.estado ? 'primary' : 'warn'" highlighted>
                  {{ u.estado ? 'Activo' : 'Inactivo' }}
                </mat-chip>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols"></tr>
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" [attr.colspan]="cols.length" style="text-align:center;padding:24px">No hay usuarios</td>
            </tr>
          </table>
        </mat-card>
      }

      @if (showDialog()) {
        <div class="dialog-backdrop" (click)="closeDialog()"></div>
        <mat-card class="dialog-card">
          <mat-card-header>
            <mat-card-title>Nuevo usuario</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="crearUsuario()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nombre</mat-label>
                <input matInput formControlName="nombre" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Correo</mat-label>
                <input matInput type="email" formControlName="correo" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>DNI</mat-label>
                <input matInput formControlName="dni" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Contraseña</mat-label>
                <input matInput type="password" formControlName="password" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Rol</mat-label>
                <mat-select formControlName="rol">
                  <mat-option value="User">User</mat-option>
                  <mat-option value="Manager">Manager</mat-option>
                  <mat-option value="Admin">Admin</mat-option>
                </mat-select>
              </mat-form-field>
              <div class="dialog-actions">
                <button mat-button type="button" (click)="closeDialog()">Cancelar</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="creando()">Crear</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .container { padding: 24px; max-width: 1000px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .center { display: flex; justify-content: center; padding: 48px; }
    .dialog-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; }
    .dialog-card { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 101; width: 420px; max-width: 95vw; padding: 8px; }
    .dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
  `],
})
export class UsuarioListComponent implements OnInit {
  auth = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  cols = ['nombre', 'correo', 'dni', 'estado'];
  usuarios = signal<UsuarioDto[]>([]);
  loading = signal(true);
  showDialog = signal(false);
  creando = signal(false);

  form = this.fb.group({
    nombre: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    dni: ['', Validators.required],
    password: ['', Validators.required],
    rol: ['User'],
  });

  ngOnInit() {
    this.usuarioService.getAll().subscribe({
      next: (u) => { this.usuarios.set(u); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openDialog() { this.showDialog.set(true); }
  closeDialog() { this.showDialog.set(false); this.form.reset({ rol: 'User' }); }

  crearUsuario() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.creando.set(true);
    const { nombre, correo, dni, password, rol } = this.form.value;
    this.usuarioService.create({ nombre: nombre!, correo: correo!, dni: dni!, password: password!, rol: rol! }).subscribe({
      next: (u) => {
        this.usuarios.update((list) => [...list, u]);
        this.snackBar.open('Usuario creado', 'OK', { duration: 3000 });
        this.closeDialog();
        this.creando.set(false);
      },
      error: () => {
        this.snackBar.open('Error al crear usuario', 'OK', { duration: 3000 });
        this.creando.set(false);
      },
    });
  }
}
