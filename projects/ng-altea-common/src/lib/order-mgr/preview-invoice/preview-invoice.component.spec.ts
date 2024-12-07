import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewInvoiceComponent } from './preview-invoice.component';

describe('PreviewInvoiceComponent', () => {
  let component: PreviewInvoiceComponent;
  let fixture: ComponentFixture<PreviewInvoiceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PreviewInvoiceComponent]
    });
    fixture = TestBed.createComponent(PreviewInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
