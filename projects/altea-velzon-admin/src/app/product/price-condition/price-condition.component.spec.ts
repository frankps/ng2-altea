import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceConditionComponent } from './price-condition.component';

describe('PriceConditionComponent', () => {
  let component: PriceConditionComponent;
  let fixture: ComponentFixture<PriceConditionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PriceConditionComponent]
    });
    fixture = TestBed.createComponent(PriceConditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
