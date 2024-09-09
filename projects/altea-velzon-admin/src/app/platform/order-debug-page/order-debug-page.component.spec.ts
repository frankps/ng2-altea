import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderDebugPageComponent } from './order-debug-page.component';

describe('OrderDebugPageComponent', () => {
  let component: OrderDebugPageComponent;
  let fixture: ComponentFixture<OrderDebugPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrderDebugPageComponent]
    });
    fixture = TestBed.createComponent(OrderDebugPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
