import { TestBed } from '@angular/core/testing';

import { RecurringTaskService } from './recurring-task.service';

describe('TaskMgmtService', () => {
  let service: RecurringTaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecurringTaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
