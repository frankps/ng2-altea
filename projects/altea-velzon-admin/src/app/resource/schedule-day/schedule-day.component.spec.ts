import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleDayComponent } from './schedule-day.component';

describe('ScheduleDayComponent', () => {
  let component: ScheduleDayComponent;
  let fixture: ComponentFixture<ScheduleDayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScheduleDayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleDayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
