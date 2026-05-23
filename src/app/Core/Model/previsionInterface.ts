
export type Signal = 'vert' | 'orange' | 'rouge';


export interface PrevisionMois {
  mois:        number;
  date:        string;
  prix_prevu:  number;
  ic_bas:      number;
  ic_haut:     number;
  signal:      Signal;
}

export interface ResumePrevision {
  prix_moyen:        number;
  prix_min:          number;
  prix_max:          number;
  signal_global:     Signal;
  modele_utilise:    string;
  date_generation:   string;
}

export interface PrevisionResult {
  horizon:    number;
  previsions: PrevisionMois[];
  resume:     ResumePrevision;
}

export interface PrevisionHistorique {
  id:         number;
  modele_id:  number;
  modele_nom: string;
  date_prev:  string;
  horizon_m:  number;
  prix_prevu: number;
  ic_bas:     number;
  ic_haut:    number;
  signal:     Signal;
  created_at: string;
}

export interface Seuils {
  seuil_bas:   number;
  seuil_haut:  number;
  description: {
    vert:   string;
    orange: string;
    rouge:  string;
  };
}