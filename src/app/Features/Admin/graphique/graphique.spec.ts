import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Graphique } from './graphique';

describe('Graphique', () => {
  let component: Graphique;
  let fixture: ComponentFixture<Graphique>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Graphique]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Graphique);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
