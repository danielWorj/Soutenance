import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SafeUrl }            from '@angular/platform-browser';
import { Subscription }       from 'rxjs';
import { Granularite, GraphiqueService, Pays } from '../../../Core/Service/Graphique/graphique-service';

// ─── état d'un panneau ───────────────────────────────────────────────────────
interface PanelState {
  loading: boolean;
  imageUrl: SafeUrl | null;
  error:    string   | null;
}

@Component({
  selector:    'app-graphique',
  standalone:  true,
  imports:     [CommonModule, ReactiveFormsModule],
  templateUrl: './graphique.html',
  styleUrl:    './graphique.css',
})
export class Graphique implements OnDestroy {

  private fb  = inject(FormBuilder);
  private svc = inject(GraphiqueService);
  private subs: Subscription[] = [];

  // ─── Signaux d'état ──────────────────────────────────────────────────────
  prixState    = signal<PanelState>({ loading: false, imageUrl: null, error: null });
  precipState  = signal<PanelState>({ loading: false, imageUrl: null, error: null });
  combState    = signal<PanelState>({ loading: false, imageUrl: null, error: null });
  prevState    = signal<PanelState>({ loading: false, imageUrl: null, error: null });

  // Signal modal
  modal = signal<{ visible: boolean; url: SafeUrl | null; titre: string }>({
    visible: false, url: null, titre: ''
  });

  // Valeur live du slider (computed depuis le form)
  nbMoisLabel = computed(() => `${this.formPrev.get('nbMois')?.value ?? 24} mois`);

  // ─── Reactive Forms ──────────────────────────────────────────────────────

  formPrix: FormGroup = this.fb.group({
    dateDebut:   ['2015-01-01', Validators.required],
    dateFin:     ['2024-12-31', Validators.required],
    granularite: ['mensuel'   , Validators.required],
  });

  formPrecip: FormGroup = this.fb.group({
    dateDebut:   ['2015-01-01', Validators.required],
    dateFin:     ['2024-12-31', Validators.required],
    granularite: ['mensuel'   , Validators.required],
    pays: this.fb.group({
      cote_ivoire: [true],
      ghana:       [true],
      cameroun:    [true],
    }),
  });

  formComb: FormGroup = this.fb.group({
    dateDebut:   ['2015-01-01', Validators.required],
    dateFin:     ['2024-12-31', Validators.required],
    paysPrecip:  ['cote_ivoire', Validators.required],
    granularite: ['mensuel'    , Validators.required],
  });

  formPrev: FormGroup = this.fb.group({
    nbMois: [24, [Validators.required, Validators.min(6), Validators.max(60)]],
  });

  // ─── Génération ──────────────────────────────────────────────────────────

  genererPrix(): void {
    if (this.formPrix.invalid) return;
    const { dateDebut, dateFin, granularite } = this.formPrix.value;
    this.prixState.set({ loading: true, imageUrl: null, error: null });

    const sub = this.svc.getPrix(dateDebut, dateFin, granularite as Granularite)
      .subscribe({
        next:  url  => { this.prixState.set({ loading: false, imageUrl: url, error: null }); },
        error: err  => { this.prixState.set({ loading: false, imageUrl: null, error: 'Erreur de chargement.' }); },
      });
    this.subs.push(sub);
  }

  genererPrecip(): void {
    if (this.formPrecip.invalid) return;
    const { dateDebut, dateFin, granularite, pays } = this.formPrecip.value;
    const paysList = (Object.keys(pays) as Pays[]).filter(k => pays[k]);
    this.precipState.set({ loading: true, imageUrl: null, error: null });

    const sub = this.svc.getPrecipitations(dateDebut, dateFin, paysList, granularite as Granularite)
      .subscribe({
        next:  url => { this.precipState.set({ loading: false, imageUrl: url, error: null }); },
        error: ()  => { this.precipState.set({ loading: false, imageUrl: null, error: 'Erreur de chargement.' }); },
      });
    this.subs.push(sub);
  }

  genererCombine(): void {
    if (this.formComb.invalid) return;
    const { dateDebut, dateFin, paysPrecip, granularite } = this.formComb.value;
    this.combState.set({ loading: true, imageUrl: null, error: null });

    const sub = this.svc.getCombine(dateDebut, dateFin, paysPrecip as Pays, granularite as Granularite)
      .subscribe({
        next:  url => { this.combState.set({ loading: false, imageUrl: url, error: null }); },
        error: ()  => { this.combState.set({ loading: false, imageUrl: null, error: 'Erreur de chargement.' }); },
      });
    this.subs.push(sub);
  }

  genererPrevision(): void {
    if (this.formPrev.invalid) return;
    const { nbMois } = this.formPrev.value;
    this.prevState.set({ loading: true, imageUrl: null, error: null });

    const sub = this.svc.getPrevision(nbMois)
      .subscribe({
        next:  url => { this.prevState.set({ loading: false, imageUrl: url, error: null }); },
        error: ()  => { this.prevState.set({ loading: false, imageUrl: null, error: 'Erreur de chargement.' }); },
      });
    this.subs.push(sub);
  }

  // ─── Téléchargement ──────────────────────────────────────────────────────

  telecharger(url: SafeUrl, filename: string): void {
    const a = document.createElement('a');
    a.href     = url as string;
    a.download = filename;
    a.click();
  }

  // ─── Modal ───────────────────────────────────────────────────────────────

  ouvrirModal(url: SafeUrl, titre: string): void {
    this.modal.set({ visible: true, url, titre });
  }

  fermerModal(): void {
    this.modal.set({ visible: false, url: null, titre: '' });
  }

  // ─── URLs de téléchargement direct ───────────────────────────────────────

  get dlUrlPrix(): string {
    const { dateDebut, dateFin, granularite } = this.formPrix.value;
    return this.svc.buildUrlPrix(dateDebut, dateFin, granularite);
  }

  get dlUrlPrecip(): string {
    const { dateDebut, dateFin, granularite, pays } = this.formPrecip.value;
    const paysList = (Object.keys(pays) as Pays[]).filter(k => pays[k]);
    return this.svc.buildUrlPrecipitations(dateDebut, dateFin, paysList, granularite);
  }

  get dlUrlComb(): string {
    const { dateDebut, dateFin, paysPrecip, granularite } = this.formComb.value;
    return this.svc.buildUrlCombine(dateDebut, dateFin, paysPrecip, granularite);
  }

  get dlUrlPrev(): string {
    return this.svc.buildUrlPrevision(this.formPrev.value.nbMois);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}