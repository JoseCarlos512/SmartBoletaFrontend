import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule],
  template: `
    <mat-toolbar color="primary">
      <span class="brand">SmartBoleta</span>
      <span class="spacer"></span>

      <a mat-button routerLink="/dashboard" routerLinkActive="active-link">Dashboard</a>
      <a mat-button routerLink="/boletas" routerLinkActive="active-link">Boletas</a>

      @if (auth.hasRole('Admin', 'Manager')) {
        <a mat-button routerLink="/boletas/carga-masiva" routerLinkActive="active-link">Carga masiva</a>
        <a mat-button routerLink="/usuarios" routerLinkActive="active-link">Usuarios</a>
      }
      @if (auth.hasRole('Admin')) {
        <a mat-button routerLink="/tenants" routerLinkActive="active-link">Tenants</a>
      }

      <button mat-icon-button [matMenuTriggerFor]="userMenu">
        <mat-icon>account_circle</mat-icon>
      </button>
      <mat-menu #userMenu="matMenu">
        <button mat-menu-item disabled>
          <mat-icon>person</mat-icon>
          <span>{{ auth.currentUser()?.nombre }}</span>
        </button>
        <button mat-menu-item disabled>
          <mat-icon>badge</mat-icon>
          <span>{{ auth.rol() }}</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="auth.logout()">
          <mat-icon>logout</mat-icon>
          <span>Cerrar sesión</span>
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [`
    .spacer { flex: 1; }
    .brand { font-weight: 700; font-size: 1.2rem; margin-right: 16px; }
    .active-link { background: rgba(255,255,255,0.15); border-radius: 4px; }
  `],
})
export class NavbarComponent {
  auth = inject(AuthService);
}
