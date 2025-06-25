import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LastMinutesComponent } from './last-minutes.component';

describe('LastMinutesComponent', () => {
  let component: LastMinutesComponent;
  let fixture: ComponentFixture<LastMinutesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LastMinutesComponent]
    });
    fixture = TestBed.createComponent(LastMinutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
