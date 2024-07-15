import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserContactMatchComponent } from './user-contact-match.component';

describe('UserContactMatchComponent', () => {
  let component: UserContactMatchComponent;
  let fixture: ComponentFixture<UserContactMatchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserContactMatchComponent]
    });
    fixture = TestBed.createComponent(UserContactMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
