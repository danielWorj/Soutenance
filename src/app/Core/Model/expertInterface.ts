export interface Modele {
  id:             number;
  nom:            string;
  ordre_p:        number;
  ordre_d:        number;
  ordre_q:        number;
  ordre_sp:       number;
  ordre_sd:       number;
  ordre_sq:       number;
  saisonnalite:   number;
  aic:            number;
  bic:            number;
  mae:            number;
  rmse:           number;
  mape:           number;
  date_debut:     string;
  date_fin:       string;
  fichier_modele: string;
  actif:          number;
  created_at:     string;
}

export interface Metriques {
  aic:        number;
  bic:        number;
  mae:        number;
  rmse:       number;
  mape:       number;
  residus_ok: boolean;
}

export interface Diagnostic {
  adf_statistic:     number;
  adf_pvalue:        number;
  adf_stationnaire:  boolean;
  kpss_stationnaire: boolean;
  d_recommande:      number;
}

export interface EntrainementResult {
  modele_id:  number | null;
  parametres: {
    ordre:        [number, number, number];
    ordre_sais:   [number, number, number, number];
    saisonnalite: number;
  };
  metriques:  Metriques;
  diagnostic: Diagnostic;
}

export interface StatutSysteme {
  modele_actif:                 Modele | null;
  nb_prix_disponibles:          number;
  nb_precipitations_disponibles: number;
  pret_pour_entrainement:       boolean;
}