import { TestBed } from '@angular/core/testing';

import { LoyaltyCardChangeService } from './loyalty-card-change.service';

describe('LoyaltyCardChangeService', () => {
  let service: LoyaltyCardChangeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoyaltyCardChangeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
