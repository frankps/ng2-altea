import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditLoyaltyProgramComponent } from './edit-loyalty-program.component';

describe('EditLoyaltyProgramComponent', () => {
  let component: EditLoyaltyProgramComponent;
  let fixture: ComponentFixture<EditLoyaltyProgramComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditLoyaltyProgramComponent]
    });
    fixture = TestBed.createComponent(EditLoyaltyProgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
