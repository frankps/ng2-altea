import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayFinishedComponent } from './pay-finished.component';

describe('PayFinishedComponent', () => {
  let component: PayFinishedComponent;
  let fixture: ComponentFixture<PayFinishedComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PayFinishedComponent]
    });
    fixture = TestBed.createComponent(PayFinishedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
