import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugResourceRequestComponent } from './debug-resource-request.component';

describe('DebugResourceRequestComponent', () => {
  let component: DebugResourceRequestComponent;
  let fixture: ComponentFixture<DebugResourceRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DebugResourceRequestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DebugResourceRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
