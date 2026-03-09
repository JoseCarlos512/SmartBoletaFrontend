import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { BoletaService } from '../../../core/services/boleta.service';
import { AuthService } from '../../../core/auth/auth.service';
import { BoletaDto } from '../../../core/models/boleta.models';
import { BoletaEstadoPipe } from '../../../shared/pipes/boleta-estado.pipe';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-boleta-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    NgClass,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatSnackBarModule,
    MatDividerModule,
    BoletaEstadoPipe,
    NavbarComponent,
  ],
  templateUrl: './boleta-detail.component.html',
  styleUrl: './boleta-detail.component.scss',
})
export class BoletaDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private boletaService = inject(BoletaService);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  boleta = signal<BoletaDto | null>(null);
  loading = signal(true);
  firmando = signal(false);

  readonly ESTADOS = ['Pendiente', 'ProcesandoOcr', 'Disponible', 'Firmada'];

  stepIndex() {
    return this.ESTADOS.indexOf(this.boleta()?.estado ?? 'Pendiente');
  }

  puedeFirmar() {
    const b = this.boleta();
    const user = this.auth.currentUser();
    return b?.estado === 'Disponible' && b?.usuarioId === user?.usuarioId;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.boletaService.getById(id).subscribe({
      next: (b) => { this.boleta.set(b); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  firmar() {
    const id = this.boleta()?.id;
    if (!id) return;

    this.firmando.set(true);
    this.boletaService.firmar(id).subscribe({
      next: () => {
        this.snackBar.open('Boleta firmada', 'OK', { duration: 3000 });
        this.boletaService.getById(id).subscribe({ next: (b) => this.boleta.set(b) });
        this.firmando.set(false);
      },
      error: (err) => {
        this.firmando.set(false);
        this.snackBar.open(err?.error?.error ?? 'No se pudo firmar', 'OK', { duration: 3000 });
      },
    });
  }
}
