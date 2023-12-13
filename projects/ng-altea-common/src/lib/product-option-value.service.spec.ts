import { TestBed } from '@angular/core/testing';

import { ProductOptionValueService } from './product-option-value.service';

describe('ProductOptionValueService', () => {
  let service: ProductOptionValueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductOptionValueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
