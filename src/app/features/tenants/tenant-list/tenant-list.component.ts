import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TenantService } from '../../../core/services/tenant.service';
import { TenantDto } from '../../../core/models/tenant.models';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatProgressSpinnerModule, MatFormFieldModule,
    MatInputModule, MatSnackBarModule, NavbarComponent,
  ],
  templateUrl: './tenant-list.component.html',
  styleUrl: './tenant-list.component.scss',
})
export class TenantListComponent implements OnInit {
  private tenantService = inject(TenantService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  cols = ['nombreComercial', 'ruc', 'colorPrimario'];
  tenants = signal<TenantDto[]>([]);
  loading = signal(true);
  showDialog = signal(false);
  creando = signal(false);

  form = this.fb.group({
    nombreComercial: ['', Validators.required],
    ruc: ['', Validators.required],
    logoUrl: ['', Validators.required],
    colorPrimario: ['', Validators.required],
    faviconUrl: ['', Validators.required],
  });

  ngOnInit() {
    this.tenantService.getAll().subscribe({
      next: (t) => { this.tenants.set(t); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  closeDialog() { this.showDialog.set(false); this.form.reset(); }

  crear() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.creando.set(true);
    const v = this.form.value;
    this.tenantService.create({
      nombreComercial: v.nombreComercial!,
      ruc: v.ruc!,
      logoUrl: v.logoUrl!,
      colorPrimario: v.colorPrimario!,
      faviconUrl: v.faviconUrl!,
    }).subscribe({
      next: (t) => {
        this.tenants.update((list) => [...list, t]);
        this.snackBar.open('Tenant creado', 'OK', { duration: 3000 });
        this.closeDialog();
        this.creando.set(false);
      },
      error: () => {
        this.snackBar.open('Error al crear tenant', 'OK', { duration: 3000 });
        this.creando.set(false);
      },
    });
  }
}
