import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourcePlanningComponent } from './resource-planning.component';

describe('ResourcePlanningComponent', () => {
  let component: ResourcePlanningComponent;
  let fixture: ComponentFixture<ResourcePlanningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResourcePlanningComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourcePlanningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
