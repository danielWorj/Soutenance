import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Prevision } from './prevision';

describe('Prevision', () => {
  let component: Prevision;
  let fixture: ComponentFixture<Prevision>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Prevision]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Prevision);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
