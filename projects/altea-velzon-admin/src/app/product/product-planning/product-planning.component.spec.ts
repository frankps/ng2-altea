import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductPlanningComponent } from './product-planning.component';

describe('ProductPlanningComponent', () => {
  let component: ProductPlanningComponent;
  let fixture: ComponentFixture<ProductPlanningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductPlanningComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductPlanningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
