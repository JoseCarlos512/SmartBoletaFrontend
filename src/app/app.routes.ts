import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'boletas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/boletas/boleta-list/boleta-list.component').then((m) => m.BoletaListComponent),
  },
  {
    path: 'boletas/subir',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Manager'] },
    loadComponent: () =>
      import('./features/boletas/subir-boleta/subir-boleta.component').then((m) => m.SubirBoletaComponent),
  },
  {
    path: 'boletas/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/boletas/boleta-detail/boleta-detail.component').then((m) => m.BoletaDetailComponent),
  },
  {
    path: 'usuarios',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'Manager'] },
    loadComponent: () =>
      import('./features/usuarios/usuario-list/usuario-list.component').then((m) => m.UsuarioListComponent),
  },
  {
    path: 'tenants',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] },
    loadComponent: () =>
      import('./features/tenants/tenant-list/tenant-list.component').then((m) => m.TenantListComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
