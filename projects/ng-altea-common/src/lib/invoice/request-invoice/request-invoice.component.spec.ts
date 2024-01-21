import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestInvoiceComponent } from './request-invoice.component';

describe('RequestInvoiceComponent', () => {
  let component: RequestInvoiceComponent;
  let fixture: ComponentFixture<RequestInvoiceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RequestInvoiceComponent]
    });
    fixture = TestBed.createComponent(RequestInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
