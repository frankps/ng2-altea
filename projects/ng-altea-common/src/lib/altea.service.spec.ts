import { TestBed } from '@angular/core/testing';

import { AlteaService } from './altea.service';

describe('AlteaService', () => {
  let service: AlteaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlteaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
