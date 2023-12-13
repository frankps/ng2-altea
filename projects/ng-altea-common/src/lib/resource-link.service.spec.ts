import { TestBed } from '@angular/core/testing';

import { ResourceLinkService } from './resource-link.service';

describe('ResourceLinkService', () => {
  let service: ResourceLinkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResourceLinkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
