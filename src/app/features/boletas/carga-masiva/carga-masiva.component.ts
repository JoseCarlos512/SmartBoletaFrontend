import { Component, inject, signal, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { interval, Subject, Subscription } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BoletaService } from '../../../core/services/boleta.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { CargaMasivaDto } from '../../../core/models/boleta.models';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

type Fase = 'form' | 'procesando' | 'resultado';

@Component({
  selector: 'app-carga-masiva',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    NgClass,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    NavbarComponent,
  ],
  templateUrl: './carga-masiva.component.html',
  styleUrl: './carga-masiva.component.scss',
})
export class CargaMasivaComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private boletaService = inject(BoletaService);
  private signalr = inject(SignalrService);
  private snackBar = inject(MatSnackBar);

  form = this.fb.group({
    periodo: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)]],
  });

  fase = signal<Fase>('form');
  archivos = signal<File[]>([]);
  uploading = signal(false);
  errorMessage = signal('');
  progreso = signal<CargaMasivaDto | null>(null);
  filesTouched = false;

  resultCols = ['nombreArchivo', 'estado', 'usuarioNombre', 'razonFallo', 'boleta'];

  private pollingStop$ = new Subject<void>();
  private subs = new Subscription();

  onFilesChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.archivos.set(Array.from(input.files ?? []));
  }

  onSubmit() {
    this.filesTouched = true;
    if (this.form.invalid || this.archivos().length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.uploading.set(true);
    this.errorMessage.set('');

    this.boletaService.subirMasiva(this.form.value.periodo!, this.archivos()).subscribe({
      next: (resp) => {
        this.uploading.set(false);
        this.fase.set('procesando');
        this.startPolling(resp.cargaMasivaId);
        this.listenSignalR(resp.cargaMasivaId);
      },
      error: (err) => {
        this.uploading.set(false);
        this.errorMessage.set(err?.error?.error ?? 'Error al iniciar la carga masiva.');
      },
    });
  }

  private startPolling(id: string) {
    // Do an immediate fetch first, then every 3s
    this.boletaService.getCargaMasiva(id).subscribe({ next: (d) => this.onProgressUpdate(id, d) });

    this.subs.add(
      interval(3000).pipe(
        takeUntil(this.pollingStop$),
        switchMap(() => this.boletaService.getCargaMasiva(id)),
      ).subscribe({ next: (d) => this.onProgressUpdate(id, d) })
    );
  }

  private onProgressUpdate(id: string, data: CargaMasivaDto) {
    this.progreso.set(data);
    if (data.estado === 'Completada' || data.estado === 'CompletadaConErrores') {
      this.stopPolling();
      this.fase.set('resultado');
    }
  }

  private listenSignalR(id: string) {
    this.subs.add(
      this.signalr.cargaMasivaCompletada$.subscribe((event) => {
        if (event.cargaMasivaId !== id) return;
        this.stopPolling();
        this.boletaService.getCargaMasiva(id).subscribe({
          next: (data) => {
            this.progreso.set(data);
            this.fase.set('resultado');
          },
        });
      })
    );
  }

  private stopPolling() {
    this.pollingStop$.next();
  }

  nuevaCarga() {
    this.stopPolling();
    this.subs.unsubscribe();
    this.form.reset();
    this.archivos.set([]);
    this.progreso.set(null);
    this.filesTouched = false;
    this.fase.set('form');
  }

  ngOnDestroy() {
    this.stopPolling();
    this.subs.unsubscribe();
  }
}
