import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PosPaymentComponent } from './pos-payment.component';

describe('PosPaymentComponent', () => {
  let component: PosPaymentComponent;
  let fixture: ComponentFixture<PosPaymentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PosPaymentComponent]
    });
    fixture = TestBed.createComponent(PosPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
