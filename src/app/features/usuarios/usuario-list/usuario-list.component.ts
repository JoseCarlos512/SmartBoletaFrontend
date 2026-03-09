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
  templateUrl: './usuario-list.component.html',
  styleUrl: './usuario-list.component.scss',
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
