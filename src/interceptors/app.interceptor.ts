import {
  HttpErrorResponse,
  HttpHeaders,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { catchError, map, of, retry, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { NotificationService } from '../services/notification.service';

const MAX_RETRY = 3;

export const appInterceptor: HttpInterceptorFn = (req, next) => {
  const loader = inject(NgxSpinnerService);
  const notify = inject(NotificationService);
  const router = inject(Router);

  let showing = false;
  const ignore = req.headers.has('ignore-global-handler');
  const method = req.method;

  const isGridRequest = req.url.includes('/data/grid');

  if (!req.headers.has('no-loader') && !isGridRequest) {
    showing = true;
    loader.show();
  }

  const req1 = req.clone({
    headers: cleanupCustomHeaders(req.headers),
  });

  return next(req1).pipe(
    retry({
      delay: (error, count) => {
        if (isRetryable(error.status, method, count)) {
          return of(error);
        }
        return throwError(() => error);
      },
    }),
    map((event) => {
      if (showing && event instanceof HttpResponse) {
        loader.hide();
      }
      return event;
    }),
    catchError((response: HttpErrorResponse) => {
      if (showing) {
        loader.hide();
      }
      if (ignore) {
        return throwError(() => response);
      }

      // handle errors like before
      switch (response.status) {
        case 401:
          notify
            .errorDialog(
              'Session Error!',
              'Session expired, please login again',
              {
                statusCode: 401,
                illustration: '401',
                confirmText: 'Go to Dashboard',
                signInText: 'Try Sign In Again',
                primary: true,
              }
            )
            .then((confirmed) => {
              if (confirmed && typeof window !== 'undefined') {
                router.navigate(['/dashboard']);
              }
            });
          break;
        case 400:
          if (response.error instanceof Blob) {
            extractBlobErrorMessage(response.error).then((errorMessage) =>
              notify.errorDialog('Invalid Request', errorMessage, { statusCode: 400 }),
            );
          } else {
            notify.errorDialog(
              'Invalid Request',
              response.error?.message || response.error?.error || 'Unknown error',
              { statusCode: 400 },
            );
          }
          break;
        case 500:
          notify.errorDialog(
            'Oops!',
            response.error?.message || response.error?.error || 'Server error',
            {
              statusCode: 500,
              illustration: '500',
              confirmText: 'Go to Dashboard',
              primary: true,
            }
          );
          break;
        default:
          notify.errorDialog(
            'Error!',
            response.error?.message || response.error?.error || response?.message || 'Unknown error',
            {
              statusCode: response.status || 500,
              confirmText: 'Go to Dashboard',
              primary: true,
            }
          );
      }

      return throwError(() => response);
    }),
  );
};

function isRetryable(status: number, method: string, count: number) {
  return method === 'GET' && count <= MAX_RETRY - 1 && status === 503;
}

function cleanupCustomHeaders(headersIn: HttpHeaders): HttpHeaders {
  const headers: Record<string, string> = {};

  headersIn
    .keys()
    .filter(
      (key: string) => !['no-loader', 'ignore-global-handler'].includes(key),
    )
    .forEach((i: string) => {
      const value = headersIn.get(i);
      if (value !== null) {
        headers[i] = value;
      }
    });

  return new HttpHeaders(headers);
}

async function extractBlobErrorMessage(error: Blob): Promise<string> {
  const text = await error.text();
  try {
    return JSON.parse(text)?.message || 'Unknown error';
  } catch {
    return 'Unknown error';
  }
}
