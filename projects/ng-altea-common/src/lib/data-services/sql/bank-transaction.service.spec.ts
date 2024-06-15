import { TestBed } from '@angular/core/testing';

import { BankTransactionService } from './bank-transaction.service';

describe('BankTransactionService', () => {
  let service: BankTransactionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BankTransactionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
