import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';
import { StateService } from './services/state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <router-outlet />
    <app-toast />
  `,
})
export class AppComponent implements OnInit {
  constructor(private state: StateService) {}

  ngOnInit() {
    // Apply persisted theme on startup
    document.documentElement.setAttribute('data-theme', this.state.themeSnapshot);
  }
}
