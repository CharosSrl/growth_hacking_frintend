import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, catchError, throwError } from 'rxjs';
import { StateService } from './state.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const state = inject(StateService);
  const auth  = inject(AuthService);
  const toast = inject(ToastService);

  const addToken = (r: HttpRequest<unknown>, token: string | null) =>
    token ? r.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : r;

  return next(addToken(req, state.tokenSnapshot)).pipe(
    catchError(err => {
      if (err.status === 401) {
        // Refresh token and retry once
        return from(auth.refreshToken()).pipe(
          switchMap(newToken => next(addToken(req, newToken))),
          catchError(retryErr => {
            toast.error('Session expired — please sign in again.');
            auth.signOut();
            return throwError(() => retryErr);
          })
        );
      }
      const msg = err.error?.detail?.[0]?.msg ?? err.error?.message ?? `Error ${err.status}`;
      if (err.status === 403)  toast.error('Access denied.');
      if (err.status === 409)  toast.info("You've reached the 10-project limit.");
      if (err.status === 422)  toast.error(msg);
      if (err.status >= 500)   toast.error('Server error — please try again.');
      return throwError(() => err);
    })
  );
};
