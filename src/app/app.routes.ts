import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { setupGuard } from './guards/setup.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./views/auth/auth.component').then(m => m.AuthComponent),
    canActivate: [setupGuard],
  },
  {
    path: 'setup',
    loadComponent: () => import('./views/setup/setup.component').then(m => m.SetupComponent),
  },
  {
    path: 'projects',
    loadComponent: () => import('./views/projects/projects.component').then(m => m.ProjectsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'canvas/:id',
    loadComponent: () => import('./views/canvas/canvas.component').then(m => m.CanvasComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];
