import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SignalrService } from './core/services/signalr.service';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
export class App implements OnInit {
  private auth = inject(AuthService);
  private signalr = inject(SignalrService);

  ngOnInit() {
    if (this.auth.isAuthenticated() && !this.auth.isTokenExpired()) {
      this.signalr.connect();
    }
  }
}
