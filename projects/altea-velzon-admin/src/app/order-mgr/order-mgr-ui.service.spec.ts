import { TestBed } from '@angular/core/testing';

import { OrderMgrUiService } from './order-mgr-ui.service';

describe('OrderMgrService', () => {
  let service: OrderMgrUiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderMgrUiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
