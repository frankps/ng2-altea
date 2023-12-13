import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleSchedulingComponent } from './schedule-scheduling.component';

describe('ScheduleSchedulingComponent', () => {
  let component: ScheduleSchedulingComponent;
  let fixture: ComponentFixture<ScheduleSchedulingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScheduleSchedulingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleSchedulingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
