import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderDebugComponent } from './order-debug.component';

describe('OrderDebugComponent', () => {
  let component: OrderDebugComponent;
  let fixture: ComponentFixture<OrderDebugComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrderDebugComponent]
    });
    fixture = TestBed.createComponent(OrderDebugComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
