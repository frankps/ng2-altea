import { TestBed } from '@angular/core/testing';

import { TaskMgmtService } from './task-mgmt.service';

describe('TaskMgmtService', () => {
  let service: TaskMgmtService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskMgmtService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
