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
  templateUrl: './subir-boleta.component.html',
  styleUrl: './subir-boleta.component.scss',
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
