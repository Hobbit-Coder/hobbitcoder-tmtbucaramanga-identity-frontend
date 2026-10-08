import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { ProblemDetails } from '@core/models/problem-details';
import { catchError, Observable, throwError } from 'rxjs';

@Service()
export class ApiService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  public Get<TResponse>(
    urlPath: string,
    params: HttpParams = new HttpParams(),
  ): Observable<TResponse> {
    return this._httpClient
      .get<TResponse>(urlPath, { params })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  public Post<TBody, TResponse>(urlPath: string, body: TBody): Observable<TResponse> {
    return this._httpClient
      .post<TResponse>(urlPath, body)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  public Put<TBody, TResponse>(urlPath: string, body: TBody): Observable<TResponse> {
    return this._httpClient
      .put<TResponse>(urlPath, body)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  public Patch<TBody, TResponse>(urlPath: string, body: TBody): Observable<TResponse> {
    return this._httpClient
      .patch<TResponse>(urlPath, body)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  public Delete<TResponse>(urlPath: string): Observable<TResponse> {
    return this._httpClient
      .delete<TResponse>(urlPath)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      console.error('An error occurred:', error.error);
    } else {
      console.error(`Backend returned code ${error.status}, body was: `, error.error);
    }
    return throwError(() => this.toProblemDetails(error));
  }

  private toProblemDetails(error: HttpErrorResponse): ProblemDetails {
    if (typeof error.error === 'object' && error.error !== null && 'status' in error.error) {
      return error.error as ProblemDetails;
    }

    return {
      type: 'about:blank',
      title: error.status === 0 ? 'Sin conexión con el servidor' : `Error HTTP ${error.status}`,
      status: error.status,
      detail: error.message,
      instance: error.url ?? '',
      errors: {},
    };
  }
}
