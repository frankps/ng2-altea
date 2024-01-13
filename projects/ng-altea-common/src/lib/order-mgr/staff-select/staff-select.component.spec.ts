import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffSelectComponent } from './staff-select.component';

describe('StaffSelectComponent', () => {
  let component: StaffSelectComponent;
  let fixture: ComponentFixture<StaffSelectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StaffSelectComponent]
    });
    fixture = TestBed.createComponent(StaffSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
