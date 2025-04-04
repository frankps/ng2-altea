import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditResourceComponent } from './edit-resource.component';

describe('EditResourceComponent', () => {
  let component: EditResourceComponent;
  let fixture: ComponentFixture<EditResourceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditResourceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditResourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
