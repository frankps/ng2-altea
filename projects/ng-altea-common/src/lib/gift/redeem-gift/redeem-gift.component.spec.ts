import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedeemGiftComponent } from './redeem-gift.component';

describe('RedeemGiftComponent', () => {
  let component: RedeemGiftComponent;
  let fixture: ComponentFixture<RedeemGiftComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RedeemGiftComponent]
    });
    fixture = TestBed.createComponent(RedeemGiftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
