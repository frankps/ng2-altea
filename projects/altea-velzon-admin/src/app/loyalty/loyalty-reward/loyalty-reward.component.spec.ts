import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoyaltyRewardComponent } from './loyalty-reward.component';

describe('LoyaltyRewardComponent', () => {
  let component: LoyaltyRewardComponent;
  let fixture: ComponentFixture<LoyaltyRewardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LoyaltyRewardComponent]
    });
    fixture = TestBed.createComponent(LoyaltyRewardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
