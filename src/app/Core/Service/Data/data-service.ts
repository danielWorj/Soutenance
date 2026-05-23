import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Endpoints } from '../../Constants/Endpoints';
import { ApercuData, ApiResponse, ImportResult, ImportToutResult, LogImport } from '../../Model/dataInterface';

@Injectable({
  providedIn: 'root',
})
export class DataService {

  constructor(private http: HttpClient) {}

  /**
   * POST /api/data/import/prix
   * Importe les prix du cacao depuis FAO/GIEWS.
   */
  importerPrix(
    dateDebut: string,
    dateFin: string
  ): Observable<ApiResponse<ImportResult>> {
    const params = new HttpParams()
      .set('date_debut', dateDebut)
      .set('date_fin',   dateFin);

    return this.http.post<ApiResponse<ImportResult>>(
      Endpoints.DATA.IMPORT_PRIX,
      null,
      { params }
    );
  }

  /**
   * POST /api/data/import/precipitations
   * Importe les précipitations (un pays ou tous).
   * @param pays  'cote_ivoire' | 'ghana' | 'cameroun' | undefined (= tous)
   */
  importerPrecipitations(
    dateDebut: string,
    dateFin: string,
    pays?: string
  ): Observable<ApiResponse<ImportResult>> {
    let params = new HttpParams()
      .set('date_debut', dateDebut)
      .set('date_fin',   dateFin);

    if (pays) {
      params = params.set('pays', pays);
    }

    return this.http.post<ApiResponse<ImportResult>>(
      Endpoints.DATA.IMPORT_PRECIPITATIONS,
      null,
      { params }
    );
  }

  /**
   * POST /api/data/import/tout
   * Import complet : prix + précipitations des 3 pays en une seule opération.
   */
  importerTout(
    dateDebut: string,
    dateFin: string
  ): Observable<ApiResponse<ImportToutResult>> {
    const params = new HttpParams()
      .set('date_debut', dateDebut)
      .set('date_fin',   dateFin);

    return this.http.post<ApiResponse<ImportToutResult>>(
      Endpoints.DATA.IMPORT_TOUT,
      null,
      { params }
    );
  }

  /**
   * GET /api/data/historique-imports
   * Retourne les 50 derniers logs d'import.
   */
  getHistoriqueImports(): Observable<ApiResponse<{ logs: LogImport[] }>> {
    return this.http.get<ApiResponse<{ logs: LogImport[] }>>(
      Endpoints.DATA.HISTORIQUE_IMPORTS
    );
  }

  /**
   * GET /api/data/apercu
   * Aperçu des données disponibles pour la modélisation.
   */
  getApercu(
    dateDebut?: string,
    dateFin?: string,
    limit: number = 10
  ): Observable<ApiResponse<ApercuData>> {
    let params = new HttpParams().set('limit', limit.toString());

    if (dateDebut) params = params.set('date_debut', dateDebut);
    if (dateFin)   params = params.set('date_fin',   dateFin);

    return this.http.get<ApiResponse<ApercuData>>(
      Endpoints.DATA.APERCU,
      { params }
    );
  }
}