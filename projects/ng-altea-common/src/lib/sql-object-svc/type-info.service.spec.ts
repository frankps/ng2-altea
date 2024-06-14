import { TestBed } from '@angular/core/testing';
import { TypeInfoService } from './type-info.service';

//import { TypeInfoService } from '../type-info.service';

describe('TypeInfoService', () => {
  let service: TypeInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TypeInfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
