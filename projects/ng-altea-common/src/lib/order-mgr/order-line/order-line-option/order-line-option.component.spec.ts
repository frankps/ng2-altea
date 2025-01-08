import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderLineOptionComponent } from './order-line-option.component';

describe('OrderLineOptionComponent', () => {
  let component: OrderLineOptionComponent;
  let fixture: ComponentFixture<OrderLineOptionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrderLineOptionComponent]
    });
    fixture = TestBed.createComponent(OrderLineOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
