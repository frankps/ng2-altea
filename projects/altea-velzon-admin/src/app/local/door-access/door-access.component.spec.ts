import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoorAccessComponent } from './door-access.component';

describe('DoorAccessComponent', () => {
  let component: DoorAccessComponent;
  let fixture: ComponentFixture<DoorAccessComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DoorAccessComponent]
    });
    fixture = TestBed.createComponent(DoorAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
