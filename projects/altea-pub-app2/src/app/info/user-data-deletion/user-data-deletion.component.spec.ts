import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDataDeletionComponent } from './user-data-deletion.component';

describe('UserDataDeletionComponent', () => {
  let component: UserDataDeletionComponent;
  let fixture: ComponentFixture<UserDataDeletionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserDataDeletionComponent]
    });
    fixture = TestBed.createComponent(UserDataDeletionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
