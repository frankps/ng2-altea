import { TestBed } from '@angular/core/testing';

import { CustomJsonService } from './custom-json.service';

describe('CustomJsonService', () => {
  let service: CustomJsonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomJsonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
