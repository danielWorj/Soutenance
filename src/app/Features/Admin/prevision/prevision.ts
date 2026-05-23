import {
  Component, OnInit, OnDestroy, AfterViewInit,
  signal, computed, inject, ViewChild, ElementRef, effect
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PrevisionMois, PrevisionResult, PrevisionHistorique, Seuils, Signal } from './../../../Core/Model/previsionInterface';
import { PrevisionService } from '../../../Core/Service/Prevision/prevision-service';

// Déclaration Chart.js (chargé via CDN)
declare const Chart: any;

@Component({
  selector: 'app-prevision',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, DecimalPipe],
  templateUrl: './prevision.html',
  styleUrl: './prevision.css',
})
export class Prevision implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('chartCanvas') chartCanvasRef!: ElementRef<HTMLCanvasElement>;

  private fb               = inject(FormBuilder);
  private previsionService = inject(PrevisionService);

  // ── Signaux ───────────────────────────────
  readonly resultat       = signal<PrevisionResult | null>(null);
  readonly historique     = signal<PrevisionHistorique[]>([]);
  readonly seuils         = signal<Seuils | null>(null);
  readonly loadingPrev    = signal(false);
  readonly loadingSeuils  = signal(false);
  readonly toast          = signal<{ msg: string; type: string } | null>(null);
  readonly horizonVal     = signal(6);

  // ── Signaux calculés ──────────────────────
  readonly resume = computed(() => this.resultat()?.resume ?? null);
  readonly previsions = computed(() => this.resultat()?.previsions ?? []);

  readonly signalGlobalClass = computed(() => {
    const s = this.resume()?.signal_global;
    return s ? this.getSignalClass(s) : '';
  });
  readonly signalGlobalLabel = computed(() => {
    const s = this.resume()?.signal_global;
    return s ? this.getSignalLabel(s) : '—';
  });

  // ── Chart.js instance ─────────────────────
  private chart: any = null;

  // ── Reactive Forms ────────────────────────
  formPrev!:   FormGroup;
  formSeuils!: FormGroup;

  constructor() {
    // Effet réactif : redessiner le chart quand les données changent
    effect(() => {
      const data = this.previsions();
      if (data.length > 0) {
        // Attendre le prochain tick pour que le canvas soit visible
        setTimeout(() => this.renderChart(data), 50);
      }
    });
  }

  ngOnInit(): void {
    this.formPrev = this.fb.group({
      horizon:    [6,    [Validators.required, Validators.min(1), Validators.max(24)]],
      seuil_bas:  [null],
      seuil_haut: [null],
    });

    this.formSeuils = this.fb.group({
      seuil_bas:  [null, [Validators.required, Validators.min(0)]],
      seuil_haut: [null, [Validators.required, Validators.min(0)]],
    });

    this.chargerSeuils();
    this.chargerHistorique();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  // ── Soumissions ───────────────────────────

  submitPrevision(): void {
    if (this.formPrev.invalid) return;
    this.loadingPrev.set(true);

    const { horizon, seuil_bas, seuil_haut } = this.formPrev.value;

    this.previsionService.generer(horizon, seuil_bas ?? undefined, seuil_haut ?? undefined).subscribe({
      next: r => {
        this.loadingPrev.set(false);
        if (r.statut) {
          this.resultat.set(r.data);
          this.fermerModal('modalPrevision');
          this.chargerHistorique();
          this.showToast(`Prévision générée sur ${horizon} mois`, 'success');
        } else {
          this.showToast(r.message, 'error');
        }
      },
      error: () => { this.loadingPrev.set(false); this.showToast('Erreur réseau', 'error'); },
    });
  }

  submitSeuils(): void {
    if (this.formSeuils.invalid) return;
    const { seuil_bas, seuil_haut } = this.formSeuils.value;
    if (seuil_bas >= seuil_haut) { this.showToast('Le seuil bas doit être inférieur au seuil haut', 'warning'); return; }

    this.previsionService.updateSeuils(seuil_bas, seuil_haut).subscribe({
      next: r => {
        this.showToast(r.message, r.statut ? 'success' : 'error');
        if (r.statut) { this.fermerModal('modalSeuils'); this.chargerSeuils(); }
      },
    });
  }

  chargerSeuils(): void {
    this.previsionService.getSeuilsActuels().subscribe({
      next: r => {
        if (r.statut) {
          this.seuils.set(r.data);
          this.formSeuils.patchValue({
            seuil_bas:  r.data.seuil_bas,
            seuil_haut: r.data.seuil_haut,
          });
        }
      },
    });
  }

  chargerHistorique(): void {
    this.previsionService.getHistorique(20).subscribe({
      next: r => { if (r.statut) this.historique.set(r.data.previsions); },
    });
  }

  onHorizonChange(event: Event): void {
    const val = +(event.target as HTMLInputElement).value;
    this.horizonVal.set(val);
    this.formPrev.patchValue({ horizon: val });
  }

  // ── Chart.js ──────────────────────────────

  private renderChart(data: PrevisionMois[]): void {
    if (!this.chartCanvasRef?.nativeElement) return;
    const ctx = this.chartCanvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Détruire l'ancien chart si existant
    this.chart?.destroy();

    const labels   = data.map(p => p.date);
    const prix     = data.map(p => p.prix_prevu);
    const icBas    = data.map(p => p.ic_bas);
    const icHaut   = data.map(p => p.ic_haut);

    // Couleurs selon signal
    const pointColors = data.map(p => {
      if (p.signal === 'rouge')  return '#d94f3d';
      if (p.signal === 'orange') return '#e07b2a';
      return '#1a7a3c';
    });

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Prix prévu (USD/t)',
            data: prix,
            borderColor: '#1a7a3c',
            backgroundColor: 'rgba(26,122,60,0.08)',
            borderWidth: 2.5,
            pointBackgroundColor: pointColors,
            pointBorderColor: pointColors,
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.35,
            fill: false,
          },
          {
            label: 'IC Haut 95%',
            data: icHaut,
            borderColor: 'rgba(26,122,60,0.25)',
            backgroundColor: 'rgba(26,122,60,0.07)',
            borderWidth: 1,
            borderDash: [4, 4],
            pointRadius: 0,
            tension: 0.35,
            fill: '+1',
          },
          {
            label: 'IC Bas 95%',
            data: icBas,
            borderColor: 'rgba(26,122,60,0.25)',
            backgroundColor: 'rgba(26,122,60,0.07)',
            borderWidth: 1,
            borderDash: [4, 4],
            pointRadius: 0,
            tension: 0.35,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: { family: 'DM Mono', size: 11 },
              color: '#4a5568',
              boxWidth: 14,
              padding: 16,
            },
          },
          tooltip: {
            backgroundColor: '#fff',
            titleColor: '#1a1f2e',
            bodyColor: '#4a5568',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            titleFont: { family: 'DM Mono', size: 11 },
            bodyFont: { family: 'DM Mono', size: 11 },
            callbacks: {
              label: (ctx: any) => {
                const val = ctx.raw as number;
                return ` ${ctx.dataset.label}: ${new Intl.NumberFormat('fr-FR').format(val)} $`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { family: 'DM Mono', size: 10 },
              color: '#8a96a8',
              maxTicksLimit: 8,
            },
          },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { family: 'DM Mono', size: 10 },
              color: '#8a96a8',
              callback: (v: number) => new Intl.NumberFormat('fr-FR').format(v) + ' $',
            },
          },
        },
      },
    });
  }

  // ── Helpers ───────────────────────────────

  getSignalClass(s: Signal | string): string {
    const map: Record<string, string> = {
      vert: 'cf-signal cf-signal-vert',
      orange: 'cf-signal cf-signal-orange',
      rouge: 'cf-signal cf-signal-rouge',
    };
    return map[s] ?? 'cf-signal';
  }

  getSignalLabel(s: Signal | string): string {
    const map: Record<string, string> = { vert: 'Stable', orange: 'Attention', rouge: 'Risque' };
    return map[s] ?? s;
  }

  formatMoney(v: number | null | undefined): string {
    if (v == null) return '—';
    return new Intl.NumberFormat('fr-FR').format(v) + ' $';
  }

  private showToast(msg: string, type: string): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 4500);
  }

  private fermerModal(id: string): void {
    const el = document.getElementById(id);
    if (el) (window as any).bootstrap?.Modal?.getInstance(el)?.hide();
  }
}