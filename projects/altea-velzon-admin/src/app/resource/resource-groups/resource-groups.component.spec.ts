import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourceGroupsComponent } from './resource-groups.component';

describe('ResourceGroupsComponent', () => {
  let component: ResourceGroupsComponent;
  let fixture: ComponentFixture<ResourceGroupsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResourceGroupsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
