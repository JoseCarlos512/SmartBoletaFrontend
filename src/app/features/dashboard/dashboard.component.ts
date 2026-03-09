import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';
import { BoletaService } from '../../core/services/boleta.service';
import { BoletaDto } from '../../core/models/boleta.models';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private boletaService = inject(BoletaService);

  boletas = signal<BoletaDto[]>([]);

  ngOnInit() {
    const user = this.auth.currentUser();
    if (!user) return;

    if (this.auth.hasRole('Admin', 'Manager')) {
      this.boletaService.getByTenant().subscribe({ next: (b) => this.boletas.set(b) });
    } else {
      this.boletaService.getByUsuario(user.usuarioId).subscribe({ next: (b) => this.boletas.set(b) });
    }
  }

  count(estado: string) {
    return this.boletas().filter((b) => b.estado === estado).length;
  }
}
