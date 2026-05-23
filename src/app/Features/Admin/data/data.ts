import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LogImport, ApercuData } from '../../../Core/Model/dataInterface';
import { DataService } from '../../../Core/Service/Data/data-service';

@Component({
  selector: 'app-data',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './data.html',
  styleUrl: './data.css',
})
export class Data implements OnInit {

  private fb          = inject(FormBuilder);
  private dataService = inject(DataService);

  // ── Signaux d'état ────────────────────────
  readonly logs          = signal<LogImport[]>([]);
  readonly apercu        = signal<ApercuData | null>(null);
  readonly loadingTout   = signal(false);
  readonly loadingPrix   = signal(false);
  readonly loadingPrecip = signal(false);
  readonly loadingEnso   = signal(false);
  readonly loadingApercu = signal(false);
  readonly toast         = signal<{ msg: string; type: string } | null>(null);

  // ── Reactive Forms ────────────────────────
  formTout!:   FormGroup;
  formPrix!:   FormGroup;
  formPrecip!: FormGroup;
  formEnso!:   FormGroup;

  ngOnInit(): void {
    this.formTout = this.fb.group({
      date_debut: ['2005-01-01', Validators.required],
      date_fin:   ['2024-12-31', Validators.required],
    });

    this.formPrix = this.fb.group({
      date_debut: ['2005-01-01', Validators.required],
      date_fin:   ['2024-12-31', Validators.required],
    });

    this.formPrecip = this.fb.group({
      date_debut: ['1999-01-01', Validators.required],
      date_fin:   ['2024-12-31', Validators.required],
      pays:       [''],
    });

    this.formEnso = this.fb.group({
      date_debut: ['1999-01-01'],
      date_fin:   ['2025-12-31'],
    });

    this.chargerLogs();
  }

  // ── Soumissions ───────────────────────────

  submitTout(): void {
    if (this.formTout.invalid) return;
    this.loadingTout.set(true);
    const { date_debut, date_fin } = this.formTout.value;

    this.dataService.importerTout(date_debut, date_fin).subscribe({
      next: r => {
        this.loadingTout.set(false);
        this.showToast(r.message, r.statut ? 'success' : 'error');
        if (r.statut) { this.chargerLogs(); this.fermerModal('modalImportTout'); }
      },
      error: () => { this.loadingTout.set(false); this.showToast('Erreur réseau', 'error'); },
    });
  }

  submitPrix(): void {
    if (this.formPrix.invalid) return;
    this.loadingPrix.set(true);
    const { date_debut, date_fin } = this.formPrix.value;

    this.dataService.importerPrix(date_debut, date_fin).subscribe({
      next: r => {
        this.loadingPrix.set(false);
        this.showToast(r.message, r.statut ? 'success' : 'error');
        if (r.statut) { this.chargerLogs(); this.fermerModal('modalImportPrix'); }
      },
      error: () => { this.loadingPrix.set(false); this.showToast('Erreur réseau', 'error'); },
    });
  }

  submitPrecip(): void {
    if (this.formPrecip.invalid) return;
    this.loadingPrecip.set(true);
    const { date_debut, date_fin, pays } = this.formPrecip.value;

    this.dataService.importerPrecipitations(date_debut, date_fin, pays || undefined).subscribe({
      next: r => {
        this.loadingPrecip.set(false);
        this.showToast(r.message, r.statut ? 'success' : 'error');
        if (r.statut) { this.chargerLogs(); this.fermerModal('modalImportPrecip'); }
      },
      error: () => { this.loadingPrecip.set(false); this.showToast('Erreur réseau', 'error'); },
    });
  }

  submitEnso(): void {
    this.loadingEnso.set(true);
    const { date_debut, date_fin } = this.formEnso.value;

    // this.dataService. importerEnso(date_debut, date_fin).subscribe({
    //   next: r => {
    //     this.loadingEnso.set(false);
    //     this.showToast(r.message, r.statut ? 'success' : 'error');
    //     if (r.statut) { this.chargerLogs(); this.fermerModal('modalImportEnso'); }
    //   },
    //   error: () => { this.loadingEnso.set(false); this.showToast('Erreur réseau', 'error'); },
    // });
  }

  chargerLogs(): void {
    this.dataService.getHistoriqueImports().subscribe({
      next: r => { if (r.statut) this.logs.set(r.data.logs); },
    });
  }

  chargerApercu(): void {
    this.loadingApercu.set(true);
    this.dataService.getApercu(undefined, undefined, 10).subscribe({
      next: r => {
        this.loadingApercu.set(false);
        if (r.statut) this.apercu.set(r.data);
      },
      error: () => this.loadingApercu.set(false),
    });
  }

  getLogClass(statut: string): string {
    return statut === 'succes' ? 'cf-log-dot succes' : 'cf-log-dot echec';
  }

  private showToast(msg: string, type: string): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 4000);
  }

  private fermerModal(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      const modal = (window as any).bootstrap?.Modal?.getInstance(el);
      modal?.hide();
    }
  }
}