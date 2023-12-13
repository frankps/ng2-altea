import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugAvailabilityComponent } from './debug-availability.component';

describe('DebugAvailabilityComponent', () => {
  let component: DebugAvailabilityComponent;
  let fixture: ComponentFixture<DebugAvailabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DebugAvailabilityComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DebugAvailabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
