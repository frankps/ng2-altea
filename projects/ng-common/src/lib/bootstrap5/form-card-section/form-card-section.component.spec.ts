import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormCardSectionComponent } from './form-card-section.component';

describe('FormCardSectionComponent', () => {
  let component: FormCardSectionComponent;
  let fixture: ComponentFixture<FormCardSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormCardSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormCardSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
