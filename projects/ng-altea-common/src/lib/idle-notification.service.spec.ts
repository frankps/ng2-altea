import { TestBed } from '@angular/core/testing';

import { IdleNotificationService } from './idle-notification.service';

describe('IdleNotificationService', () => {
  let service: IdleNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdleNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
