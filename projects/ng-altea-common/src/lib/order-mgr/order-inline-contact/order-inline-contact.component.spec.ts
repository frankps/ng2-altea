import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderInlineContactComponent } from './order-inline-contact.component';

describe('OrderInlineContactComponent', () => {
  let component: OrderInlineContactComponent;
  let fixture: ComponentFixture<OrderInlineContactComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrderInlineContactComponent]
    });
    fixture = TestBed.createComponent(OrderInlineContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
