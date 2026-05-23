import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Modele, StatutSysteme } from '../../../Core/Model/expertInterface';
import { ExpertService } from '../../../Core/Service/Expert/expert-service';

@Component({
  selector: 'app-systeme-expert',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './systeme-expert.html',
  styleUrl: './systeme-expert.css',
})
export class SystemeExpert implements OnInit {

  private fb            = inject(FormBuilder);
  private expertService = inject(ExpertService);

  // ── Signaux ───────────────────────────────
  readonly statut        = signal<StatutSysteme | null>(null);
  readonly modeleActif   = signal<Modele | null>(null);
  readonly modeles       = signal<Modele[]>([]);
  readonly loadingTrain  = signal(false);
  readonly loadingPage   = signal(false);
  readonly toast         = signal<{ msg: string; type: string } | null>(null);

  // ── Signaux calculés ──────────────────────
  readonly systemePret = computed(() => this.statut()?.pret_pour_entrainement ?? false);
  readonly nbPrix      = computed(() => this.statut()?.nb_prix_disponibles ?? 0);
  readonly nbPrecip    = computed(() => this.statut()?.nb_precipitations_disponibles ?? 0);

  // ── Reactive Form Entraînement ────────────
  formTrain!: FormGroup;

  ngOnInit(): void {
    this.formTrain = this.fb.group({
      saisonnalite: [12, [Validators.required, Validators.min(1)]],
      date_debut:   [''],
      date_fin:     [''],
    });
    this.chargerPage();
  }

  chargerPage(): void {
    this.loadingPage.set(true);

    this.expertService.getStatut().subscribe({
      next: r => {
        if (r.statut) {
          this.statut.set(r.data);
          this.modeleActif.set(r.data.modele_actif);
        }
      },
    });

    this.expertService.getHistoriqueModeles().subscribe({
      next: r => {
        if (r.statut) this.modeles.set(r.data.modeles);
        this.loadingPage.set(false);
      },
      error: () => this.loadingPage.set(false),
    });
  }

  submitEntrainement(): void {
    if (this.formTrain.invalid) return;
    this.loadingTrain.set(true);

    const { saisonnalite, date_debut, date_fin } = this.formTrain.value;

    this.expertService.entrainer(
      saisonnalite,
      date_debut || undefined,
      date_fin   || undefined
    ).subscribe({
      next: r => {
        this.loadingTrain.set(false);
        this.showToast(r.message, r.statut ? 'success' : 'error');
        if (r.statut) {
          this.fermerModal('modalEntrainer');
          this.chargerPage();
        }
      },
      error: () => {
        this.loadingTrain.set(false);
        this.showToast('Erreur réseau', 'error');
      },
    });
  }

  activerModele(id: number): void {
    this.expertService.activerModele(id).subscribe({
      next: r => {
        this.showToast(r.message, r.statut ? 'success' : 'error');
        if (r.statut) this.chargerPage();
      },
    });
  }

  supprimerModele(id: number): void {
    if (!confirm(`Supprimer le modèle #${id} ?`)) return;
    this.expertService.supprimerModele(id).subscribe({
      next: r => {
        this.showToast(r.message, r.statut ? 'success' : 'error');
        if (r.statut) this.chargerPage();
      },
    });
  }

  getOrdresLabel(m: Modele): string {
    return `(${m.ordre_p},${m.ordre_d},${m.ordre_q})(${m.ordre_sp},${m.ordre_sd},${m.ordre_sq},${m.saisonnalite})`;
  }

  private showToast(msg: string, type: string): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 4000);
  }

  private fermerModal(id: string): void {
    const el = document.getElementById(id);
    if (el) (window as any).bootstrap?.Modal?.getInstance(el)?.hide();
  }
}