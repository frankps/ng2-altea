import { TestBed } from '@angular/core/testing';

import { OrderFirestoreService } from './order-firestore.service';

describe('OrderFirestoreService', () => {
  let service: OrderFirestoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderFirestoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
