import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Endpoints } from '../../Constants/Endpoints';
import { EntrainementResult, Modele, StatutSysteme } from '../../Model/expertInterface';
import { ApiResponse } from '../../Model/dataInterface';


@Injectable({
  providedIn: 'root',
})
export class ExpertService {

  constructor(private http: HttpClient) {}

  /**
   * POST /api/expert/entrainer
   * Lance le cycle complet du système expert :
   * diagnostic → sélection ordres AIC → entraînement SARIMAX → validation → sauvegarde.
   */
  entrainer(
    saisonnalite: number = 12,
    dateDebut?: string,
    dateFin?: string
  ): Observable<ApiResponse<EntrainementResult>> {
    let params = new HttpParams().set('saisonnalite', saisonnalite.toString());

    if (dateDebut) params = params.set('date_debut', dateDebut);
    if (dateFin)   params = params.set('date_fin',   dateFin);

    return this.http.post<ApiResponse<EntrainementResult>>(
      Endpoints.EXPERT.ENTRAINER,
      null,
      { params }
    );
  }

  /**
   * GET /api/expert/statut
   * Retourne l'état global du système expert.
   */
  getStatut(): Observable<ApiResponse<StatutSysteme>> {
    return this.http.get<ApiResponse<StatutSysteme>>(
      Endpoints.EXPERT.STATUT
    );
  }

  /**
   * GET /api/expert/modele-actif
   * Retourne les informations du modèle SARIMAX actuellement actif.
   */
  getModeleActif(): Observable<ApiResponse<Modele>> {
    return this.http.get<ApiResponse<Modele>>(
      Endpoints.EXPERT.MODELE_ACTIF
    );
  }

  /**
   * GET /api/expert/historique-modeles
   * Retourne la liste de tous les modèles entraînés.
   */
  getHistoriqueModeles(): Observable<ApiResponse<{ modeles: Modele[] }>> {
    return this.http.get<ApiResponse<{ modeles: Modele[] }>>(
      Endpoints.EXPERT.HISTORIQUE_MODELES
    );
  }

  /**
   * PUT /api/expert/activer/:id
   * Active un modèle spécifique (désactive les autres).
   */
  activerModele(id: number): Observable<ApiResponse<{ modele_id: number }>> {
    return this.http.put<ApiResponse<{ modele_id: number }>>(
      Endpoints.EXPERT.ACTIVER(id),
      null
    );
  }

  /**
   * DELETE /api/expert/modele/:id
   * Supprime un modèle de la BDD et son fichier pickle.
   * Le modèle actif ne peut pas être supprimé.
   */
  supprimerModele(id: number): Observable<ApiResponse<{ modele_id: number }>> {
    return this.http.delete<ApiResponse<{ modele_id: number }>>(
      Endpoints.EXPERT.SUPPRIMER(id)
    );
  }
}