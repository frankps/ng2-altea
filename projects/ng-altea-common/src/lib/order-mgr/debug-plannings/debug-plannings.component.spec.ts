import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebugPlanningsComponent } from './debug-plannings.component';

describe('DebugPlanningsComponent', () => {
  let component: DebugPlanningsComponent;
  let fixture: ComponentFixture<DebugPlanningsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DebugPlanningsComponent]
    });
    fixture = TestBed.createComponent(DebugPlanningsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
