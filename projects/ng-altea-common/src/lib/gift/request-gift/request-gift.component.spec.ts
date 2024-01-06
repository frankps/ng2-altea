import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestGiftComponent } from './request-gift.component';

describe('RequestGiftComponent', () => {
  let component: RequestGiftComponent;
  let fixture: ComponentFixture<RequestGiftComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RequestGiftComponent]
    });
    fixture = TestBed.createComponent(RequestGiftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
