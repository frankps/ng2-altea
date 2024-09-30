import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderDebugInfoComponent } from './order-debug-info.component';

describe('OrderDebugInfoComponent', () => {
  let component: OrderDebugInfoComponent;
  let fixture: ComponentFixture<OrderDebugInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrderDebugInfoComponent]
    });
    fixture = TestBed.createComponent(OrderDebugInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
