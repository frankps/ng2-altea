import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageTemplatesComponent } from './manage-templates.component';

describe('ManageTemplatesComponent', () => {
  let component: ManageTemplatesComponent;
  let fixture: ComponentFixture<ManageTemplatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManageTemplatesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
