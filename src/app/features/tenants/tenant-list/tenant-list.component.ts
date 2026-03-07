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
  template: `
    <app-navbar></app-navbar>
    <div class="container">
      <div class="header">
        <h1>Tenants</h1>
        <button mat-raised-button color="primary" (click)="showDialog.set(true)">
          <mat-icon>add_business</mat-icon> Nuevo tenant
        </button>
      </div>

      @if (loading()) {
        <div class="center"><mat-spinner></mat-spinner></div>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="tenants()" class="full-width">
            <ng-container matColumnDef="nombreComercial">
              <th mat-header-cell *matHeaderCellDef>Nombre Comercial</th>
              <td mat-cell *matCellDef="let t">{{ t.nombreComercial }}</td>
            </ng-container>
            <ng-container matColumnDef="ruc">
              <th mat-header-cell *matHeaderCellDef>RUC</th>
              <td mat-cell *matCellDef="let t">{{ t.ruc }}</td>
            </ng-container>
            <ng-container matColumnDef="colorPrimario">
              <th mat-header-cell *matHeaderCellDef>Color</th>
              <td mat-cell *matCellDef="let t">
                <span class="color-chip" [style.background]="t.colorPrimario"></span>
                {{ t.colorPrimario }}
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols"></tr>
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" [attr.colspan]="cols.length" style="text-align:center;padding:24px">No hay tenants</td>
            </tr>
          </table>
        </mat-card>
      }

      @if (showDialog()) {
        <div class="dialog-backdrop" (click)="closeDialog()"></div>
        <mat-card class="dialog-card">
          <mat-card-header>
            <mat-card-title>Nuevo tenant</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="crear()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nombre Comercial</mat-label>
                <input matInput formControlName="nombreComercial" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>RUC</mat-label>
                <input matInput formControlName="ruc" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Logo URL</mat-label>
                <input matInput formControlName="logoUrl" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Color Primario (hex)</mat-label>
                <input matInput formControlName="colorPrimario" placeholder="#3f51b5" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Favicon URL</mat-label>
                <input matInput formControlName="faviconUrl" />
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
    .color-chip { display: inline-block; width: 16px; height: 16px; border-radius: 50%; border: 1px solid #ccc; vertical-align: middle; margin-right: 8px; }
    .dialog-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; }
    .dialog-card { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 101; width: 460px; max-width: 95vw; padding: 8px; }
    .dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
  `],
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
