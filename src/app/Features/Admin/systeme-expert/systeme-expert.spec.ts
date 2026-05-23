import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemeExpert } from './systeme-expert';

describe('SystemeExpert', () => {
  let component: SystemeExpert;
  let fixture: ComponentFixture<SystemeExpert>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemeExpert]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SystemeExpert);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
