import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SyncFusSchedulerComponent } from './sync-fus-scheduler.component';

describe('SyncFusSchedulerComponent', () => {
  let component: SyncFusSchedulerComponent;
  let fixture: ComponentFixture<SyncFusSchedulerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SyncFusSchedulerComponent]
    });
    fixture = TestBed.createComponent(SyncFusSchedulerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
