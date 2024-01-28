import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactSelect2Component } from './contact-select2.component';

describe('ContactSelect2Component', () => {
  let component: ContactSelect2Component;
  let fixture: ComponentFixture<ContactSelect2Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ContactSelect2Component]
    });
    fixture = TestBed.createComponent(ContactSelect2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
