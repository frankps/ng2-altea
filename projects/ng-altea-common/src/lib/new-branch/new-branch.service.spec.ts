import { TestBed } from '@angular/core/testing';

import { NewBranchService } from './new-branch.service';

describe('NewBranchService', () => {
  let service: NewBranchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NewBranchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
