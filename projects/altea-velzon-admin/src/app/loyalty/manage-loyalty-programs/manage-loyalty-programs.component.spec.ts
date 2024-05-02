import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageLoyaltyProgramsComponent } from './manage-loyalty-programs.component';

describe('ManageLoyaltyProgramsComponent', () => {
  let component: ManageLoyaltyProgramsComponent;
  let fixture: ComponentFixture<ManageLoyaltyProgramsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManageLoyaltyProgramsComponent]
    });
    fixture = TestBed.createComponent(ManageLoyaltyProgramsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
