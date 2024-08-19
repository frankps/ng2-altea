import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailPasswdComponent } from './email-passwd.component';

describe('EmailPasswdComponent', () => {
  let component: EmailPasswdComponent;
  let fixture: ComponentFixture<EmailPasswdComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmailPasswdComponent]
    });
    fixture = TestBed.createComponent(EmailPasswdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
