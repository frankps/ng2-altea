import { TestBed } from '@angular/core/testing';

import { TemplateMessageService } from './template-message.service';

describe('TemplateMessageService', () => {
  let service: TemplateMessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemplateMessageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
