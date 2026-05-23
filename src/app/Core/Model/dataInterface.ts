
export interface ApiResponse<T = any> {
  statut:  boolean;
  message: string;
  data:    T;
}

export interface ImportResult {
  nb_lignes: number;
}

export interface ImportToutResult {
  prix: {
    statut:    boolean;
    message:   string;
    nb_lignes: number;
  };
  precipitations: {
    statut:    boolean;
    message:   string;
    nb_lignes: number;
  };
}

export interface LogImport {
  id:         number;
  source:     string;
  type_data:  string;
  statut:     'succes' | 'echec';
  message:    string;
  nb_lignes:  number;
  created_at: string;
}

export interface ApercuData {
  total_mois:  number;
  date_debut:  string | null;
  date_fin:    string | null;
  apercu:      Record<string, any>[];
}
