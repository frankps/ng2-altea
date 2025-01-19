import { TestBed } from '@angular/core/testing';

import { ReportMonthService } from './report-month.service';

describe('ReportMonthService', () => {
  let service: ReportMonthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportMonthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
