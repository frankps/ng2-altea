import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StripeEventsComponent } from './stripe-events.component';

describe('StripeEventsComponent', () => {
  let component: StripeEventsComponent;
  let fixture: ComponentFixture<StripeEventsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StripeEventsComponent]
    });
    fixture = TestBed.createComponent(StripeEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
