import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PrevisionHistorique, PrevisionResult, Seuils } from '../../Model/previsionInterface';
import { ApiResponse } from '../../Model/dataInterface';
import { Endpoints } from '../../Constants/Endpoints';


// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────



// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

@Injectable({
  providedIn: 'root',
})
export class PrevisionService {

  constructor(private http: HttpClient) {}

  /**
   * POST /api/prevision/generer
   * Génère une prévision sur N mois à partir du modèle SARIMAX actif.
   * @param horizon    Nombre de mois (1 à 24)
   * @param seuilBas   Seuil bas alerte USD/tonne (optionnel)
   * @param seuilHaut  Seuil haut alerte USD/tonne (optionnel)
   */
  generer(
    horizon: number = 6,
    seuilBas?: number,
    seuilHaut?: number
  ): Observable<ApiResponse<PrevisionResult>> {
    let params = new HttpParams().set('horizon', horizon.toString());

    if (seuilBas  !== undefined) params = params.set('seuil_bas',  seuilBas.toString());
    if (seuilHaut !== undefined) params = params.set('seuil_haut', seuilHaut.toString());

    return this.http.post<ApiResponse<PrevisionResult>>(
      Endpoints.PREVISION.GENERER,
      null,
      { params }
    );
  }

  /**
   * GET /api/prevision/historique
   * Retourne l'historique des prévisions générées.
   * @param limit  Nombre max de résultats (1 à 500, défaut 100)
   */
  getHistorique(limit: number = 100): Observable<ApiResponse<{ previsions: PrevisionHistorique[] }>> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.http.get<ApiResponse<{ previsions: PrevisionHistorique[] }>>(
      Endpoints.PREVISION.HISTORIQUE,
      { params }
    );
  }

  /**
   * GET /api/prevision/:id
   * Retourne le détail d'une prévision par son ID.
   */
  getDetail(id: number): Observable<ApiResponse<PrevisionHistorique>> {
    return this.http.get<ApiResponse<PrevisionHistorique>>(
      Endpoints.PREVISION.DETAIL(id)
    );
  }

  /**
   * GET /api/prevision/seuils/actuels
   * Retourne les seuils d'alerte actuellement configurés.
   */
  getSeuilsActuels(): Observable<ApiResponse<Seuils>> {
    return this.http.get<ApiResponse<Seuils>>(
      Endpoints.PREVISION.SEUILS_ACTUELS
    );
  }

  /**
   * PUT /api/prevision/seuils
   * Met à jour les seuils d'alerte.
   */
  updateSeuils(
    seuilBas: number,
    seuilHaut: number
  ): Observable<ApiResponse<Seuils>> {
    return this.http.put<ApiResponse<Seuils>>(
      Endpoints.PREVISION.SEUILS,
      { seuil_bas: seuilBas, seuil_haut: seuilHaut }
    );
  }
}