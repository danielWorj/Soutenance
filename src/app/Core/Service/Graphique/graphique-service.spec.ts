import { TestBed } from '@angular/core/testing';

import { GraphiqueService } from './graphique-service';

describe('GraphiqueService', () => {
  let service: GraphiqueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GraphiqueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
