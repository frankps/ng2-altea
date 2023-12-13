import { TestBed } from '@angular/core/testing';

import { ResourcePlanningService } from './resource-planning.service';

describe('ResourcePlanningService', () => {
  let service: ResourcePlanningService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResourcePlanningService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
