import { TestBed } from '@angular/core/testing';

import { OrderMgrService } from './order-mgr.service';

describe('OrderMgrService', () => {
  let service: OrderMgrService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderMgrService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
