import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ngbs5Component } from './ngbs5.component';

describe('Ngbs5Component', () => {
  let component: Ngbs5Component;
  let fixture: ComponentFixture<Ngbs5Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [Ngbs5Component]
    });
    fixture = TestBed.createComponent(Ngbs5Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
