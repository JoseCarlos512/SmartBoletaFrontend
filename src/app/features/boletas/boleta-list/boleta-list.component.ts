import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { BoletaService } from '../../../core/services/boleta.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { BoletaDto, BoletaEstado } from '../../../core/models/boleta.models';
import { BoletaEstadoPipe } from '../../../shared/pipes/boleta-estado.pipe';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-boleta-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCardModule,
    DatePipe,
    NgClass,
    BoletaEstadoPipe,
    NavbarComponent,
  ],
  templateUrl: './boleta-list.component.html',
  styleUrl: './boleta-list.component.scss',
})
export class BoletaListComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private boletaService = inject(BoletaService);
  private signalr = inject(SignalrService);

  cols = ['periodo', 'archivoNombre', 'estado', 'fechaSubida', 'acciones'];
  boletas = signal<BoletaDto[]>([]);
  loading = signal(true);

  private subs = new Subscription();

  ngOnInit() {
    this.loadBoletas();

    this.subs.add(
      this.signalr.boletaProcesada$.subscribe(() => this.loadBoletas())
    );
    this.subs.add(
      this.signalr.boletaFirmada$.subscribe(() => this.loadBoletas())
    );
    this.subs.add(
      this.signalr.cargaMasivaCompletada$.subscribe(() => this.loadBoletas())
    );
  }

  loadBoletas() {
    const user = this.auth.currentUser();
    if (!user) return;

    const obs = this.auth.hasRole('Admin', 'Manager')
      ? this.boletaService.getByTenant()
      : this.boletaService.getByUsuario(user.usuarioId);

    obs.subscribe({
      next: (b) => { this.boletas.set(b); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
