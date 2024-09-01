import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebugMessagingComponent } from './debug-messaging.component';

describe('DebugMessagingComponent', () => {
  let component: DebugMessagingComponent;
  let fixture: ComponentFixture<DebugMessagingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DebugMessagingComponent]
    });
    fixture = TestBed.createComponent(DebugMessagingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
