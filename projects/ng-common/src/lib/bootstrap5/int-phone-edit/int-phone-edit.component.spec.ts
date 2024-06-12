import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntPhoneEditComponent } from './int-phone-edit.component';

describe('IntPhoneEditComponent', () => {
  let component: IntPhoneEditComponent;
  let fixture: ComponentFixture<IntPhoneEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IntPhoneEditComponent]
    });
    fixture = TestBed.createComponent(IntPhoneEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
