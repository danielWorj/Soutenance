import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Endpoints } from '../../Constants/Endpoints';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type Granularite = 'journalier' | 'mensuel' | 'trimestriel' | 'annuel';
export type Pays        = 'cote_ivoire' | 'ghana' | 'cameroun';

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

@Injectable({
  providedIn: 'root',
})
export class GraphiqueService {

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  // ─────────────────────────────────────────
  // Méthode utilitaire interne
  // Récupère l'image en Blob et retourne une URL sécurisée
  // ─────────────────────────────────────────

  private fetchImage(url: string, params: HttpParams): Observable<SafeUrl> {
    return this.http
      .get(url, { params, responseType: 'blob' })
      .pipe(
        map((blob: Blob) => {
          const objectUrl = URL.createObjectURL(blob);
          return this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        })
      );
  }

  /**
   * Construit l'URL brute d'un graphique (utile pour <img [src]="url">
   * via un pipe async ou pour un lien de téléchargement direct).
   */
  buildUrlPrix(
    dateDebut: string,
    dateFin: string,
    granularite: Granularite = 'mensuel'
  ): string {
    return `${Endpoints.GRAPHIQUE.PRIX}?date_debut=${dateDebut}&date_fin=${dateFin}&granularite=${granularite}`;
  }

  buildUrlPrecipitations(
    dateDebut: string,
    dateFin: string,
    pays?: Pays[],
    granularite: Granularite = 'mensuel'
  ): string {
    let url = `${Endpoints.GRAPHIQUE.PRECIPITATIONS}?date_debut=${dateDebut}&date_fin=${dateFin}&granularite=${granularite}`;
    if (pays && pays.length > 0) url += `&pays=${pays.join(',')}`;
    return url;
  }

  buildUrlCombine(
    dateDebut: string,
    dateFin: string,
    paysPrecip: Pays = 'cote_ivoire',
    granularite: Granularite = 'mensuel'
  ): string {
    return `${Endpoints.GRAPHIQUE.COMBINE}?date_debut=${dateDebut}&date_fin=${dateFin}&pays_precip=${paysPrecip}&granularite=${granularite}`;
  }

  buildUrlPrevision(
    nbMoisHistorique: number = 24,
    modeleId?: number
  ): string {
    let url = `${Endpoints.GRAPHIQUE.PREVISION}?nb_mois_historique=${nbMoisHistorique}`;
    if (modeleId !== undefined) url += `&modele_id=${modeleId}`;
    return url;
  }

  // ─────────────────────────────────────────
  // Méthodes Observable → SafeUrl
  // (pour affichage dans un template Angular
  //  via pipe async + [src])
  // ─────────────────────────────────────────

  /**
   * GET /api/graphique/prix
   * Courbe des prix du cacao sur une période.
   * Retourne une SafeUrl utilisable dans [src] d'une balise <img>.
   */
  getPrix(
    dateDebut: string,
    dateFin: string,
    granularite: Granularite = 'mensuel'
  ): Observable<SafeUrl> {
    const params = new HttpParams()
      .set('date_debut',  dateDebut)
      .set('date_fin',    dateFin)
      .set('granularite', granularite);

    return this.fetchImage(Endpoints.GRAPHIQUE.PRIX, params);
  }

  /**
   * GET /api/graphique/precipitations
   * Précipitations par pays sur une période.
   * @param pays  Liste de pays (vide = tous les 3)
   */
  getPrecipitations(
    dateDebut: string,
    dateFin: string,
    pays?: Pays[],
    granularite: Granularite = 'mensuel'
  ): Observable<SafeUrl> {
    let params = new HttpParams()
      .set('date_debut',  dateDebut)
      .set('date_fin',    dateFin)
      .set('granularite', granularite);

    if (pays && pays.length > 0) {
      params = params.set('pays', pays.join(','));
    }

    return this.fetchImage(Endpoints.GRAPHIQUE.PRECIPITATIONS, params);
  }

  /**
   * GET /api/graphique/combine
   * Graphique double axe : prix cacao + précipitations d'un pays.
   */
  getCombine(
    dateDebut: string,
    dateFin: string,
    paysPrecip: Pays = 'cote_ivoire',
    granularite: Granularite = 'mensuel'
  ): Observable<SafeUrl> {
    const params = new HttpParams()
      .set('date_debut',  dateDebut)
      .set('date_fin',    dateFin)
      .set('pays_precip', paysPrecip)
      .set('granularite', granularite);

    return this.fetchImage(Endpoints.GRAPHIQUE.COMBINE, params);
  }

  /**
   * GET /api/graphique/prevision
   * Historique + prévisions + intervalle de confiance.
   * @param nbMoisHistorique  Nombre de mois d'historique à afficher (défaut : 24)
   * @param modeleId          ID du modèle (défaut : modèle actif)
   */
  getPrevision(
    nbMoisHistorique: number = 24,
    modeleId?: number
  ): Observable<SafeUrl> {
    let params = new HttpParams()
      .set('nb_mois_historique', nbMoisHistorique.toString());

    if (modeleId !== undefined) {
      params = params.set('modele_id', modeleId.toString());
    }

    return this.fetchImage(Endpoints.GRAPHIQUE.PREVISION, params);
  }
}