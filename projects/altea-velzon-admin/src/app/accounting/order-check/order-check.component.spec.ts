import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderCheckComponent } from './order-check.component';

describe('OrderCheckComponent', () => {
  let component: OrderCheckComponent;
  let fixture: ComponentFixture<OrderCheckComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrderCheckComponent]
    });
    fixture = TestBed.createComponent(OrderCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
