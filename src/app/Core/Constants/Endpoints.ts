/**
 * Endpoints.ts
 * Centralise toutes les URLs de l'API Flask CacaoForecast.
 * Modifier BASE_URL selon l'environnement (dev / prod).
 */

export const BASE_URL = 'http://localhost:5000';

export const Endpoints = {

  // ─────────────────────────────────────────
  // Import des données  →  /api/data
  // ─────────────────────────────────────────
  DATA: {
    IMPORT_PRIX:           `${BASE_URL}/api/data/import/prix`,
    IMPORT_PRECIPITATIONS: `${BASE_URL}/api/data/import/precipitations`,
    IMPORT_TOUT:           `${BASE_URL}/api/data/import/tout`,
    HISTORIQUE_IMPORTS:    `${BASE_URL}/api/data/historique-imports`,
    APERCU:                `${BASE_URL}/api/data/apercu`,
  },

  // ─────────────────────────────────────────
  // Système expert  →  /api/expert
  // ─────────────────────────────────────────
  EXPERT: {
    ENTRAINER:          `${BASE_URL}/api/expert/entrainer`,
    STATUT:             `${BASE_URL}/api/expert/statut`,
    MODELE_ACTIF:       `${BASE_URL}/api/expert/modele-actif`,
    HISTORIQUE_MODELES: `${BASE_URL}/api/expert/historique-modeles`,
    ACTIVER:            (id: number) => `${BASE_URL}/api/expert/activer/${id}`,
    SUPPRIMER:          (id: number) => `${BASE_URL}/api/expert/modele/${id}`,
  },

  // ─────────────────────────────────────────
  // Prévisions  →  /api/prevision
  // ─────────────────────────────────────────
  PREVISION: {
    GENERER:        `${BASE_URL}/api/prevision/generer`,
    HISTORIQUE:     `${BASE_URL}/api/prevision/historique`,
    DETAIL:         (id: number) => `${BASE_URL}/api/prevision/${id}`,
    SEUILS:         `${BASE_URL}/api/prevision/seuils`,
    SEUILS_ACTUELS: `${BASE_URL}/api/prevision/seuils/actuels`,
  },

  // ─────────────────────────────────────────
  // Graphiques  →  /api/graphique  (retournent une image PNG)
  // ─────────────────────────────────────────
  GRAPHIQUE: {
    PRIX:           `${BASE_URL}/api/graphique/prix`,
    PRECIPITATIONS: `${BASE_URL}/api/graphique/precipitations`,
    COMBINE:        `${BASE_URL}/api/graphique/combine`,
    PREVISION:      `${BASE_URL}/api/graphique/prevision`,
  },

} as const;