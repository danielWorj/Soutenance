import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ExpertService } from '../../../Core/Service/Expert/expert-service';
import { PrevisionService } from '../../../Core/Service/Prevision/prevision-service';
import { DataService } from '../../../Core/Service/Data/data-service';
import { Modele, StatutSysteme } from '../../../Core/Model/expertInterface';
import { PrevisionHistorique } from '../../../Core/Model/previsionInterface';
import { LogImport } from '../../../Core/Model/dataInterface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  private expertService   = inject(ExpertService);
  private previsionService = inject(PrevisionService);
  private dataService     = inject(DataService);

  // ── Signaux d'état ────────────────────────
  readonly statut         = signal<StatutSysteme | null>(null);
  readonly modeleActif    = signal<Modele | null>(null);
  readonly dernieresPrev  = signal<PrevisionHistorique[]>([]);
  readonly derniersLogs   = signal<LogImport[]>([]);
  readonly loading        = signal(false);

  // ── Signaux calculés ──────────────────────
  readonly nbPrix    = computed(() => this.statut()?.nb_prix_disponibles ?? 0);
  readonly nbPrecip  = computed(() => this.statut()?.nb_precipitations_disponibles ?? 0);
  readonly systemePret = computed(() => this.statut()?.pret_pour_entrainement ?? false);

  readonly mae  = computed(() => this.modeleActif()?.mae?.toFixed(2)  ?? '—');
  readonly rmse = computed(() => this.modeleActif()?.rmse?.toFixed(2) ?? '—');
  readonly mape = computed(() => this.modeleActif()?.mape != null ? this.modeleActif()!.mape.toFixed(2) + '%' : '—');
  readonly aic  = computed(() => this.modeleActif()?.aic?.toFixed(1)  ?? '—');
  readonly nomModele = computed(() => this.modeleActif()?.nom ?? '—');

  ngOnInit(): void {
    this.chargerDashboard();
  }

  chargerDashboard(): void {
    this.loading.set(true);

    // Statut système
    this.expertService.getStatut().subscribe({
      next: r => {
        if (r.statut) {
          this.statut.set(r.data);
          this.modeleActif.set(r.data.modele_actif);
        }
      },
    });

    // Dernières prévisions
    this.previsionService.getHistorique(5).subscribe({
      next: r => {
        if (r.statut) this.dernieresPrev.set(r.data.previsions);
      },
    });

    // Derniers logs
    this.dataService.getHistoriqueImports().subscribe({
      next: r => {
        if (r.statut) this.derniersLogs.set(r.data.logs.slice(0, 5));
        this.loading.set(false);
      },
    });
  }

  getSignalClass(signal: string): string {
    const map: Record<string, string> = {
      vert:   'cf-signal cf-signal-vert',
      orange: 'cf-signal cf-signal-orange',
      rouge:  'cf-signal cf-signal-rouge',
    };
    return map[signal] ?? 'cf-signal';
  }

  getSignalLabel(signal: string): string {
    const map: Record<string, string> = { vert: 'Stable', orange: 'Attention', rouge: 'Risque' };
    return map[signal] ?? signal;
  }

  getLogClass(statut: string): string {
    return statut === 'succes' ? 'cf-log-dot succes' : 'cf-log-dot echec';
  }

  formatMoney(v: number | null | undefined): string {
    if (v == null) return '—';
    return new Intl.NumberFormat('fr-FR').format(v) + ' $';
  }
}