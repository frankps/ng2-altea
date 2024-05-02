import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoyaltyProgramListComponent } from './loyalty-program-list.component';

describe('LoyaltyProgramListComponent', () => {
  let component: LoyaltyProgramListComponent;
  let fixture: ComponentFixture<LoyaltyProgramListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LoyaltyProgramListComponent]
    });
    fixture = TestBed.createComponent(LoyaltyProgramListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
