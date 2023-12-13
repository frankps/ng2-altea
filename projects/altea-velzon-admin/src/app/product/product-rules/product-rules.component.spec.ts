import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductRulesComponent } from './product-rules.component';

describe('ProductRulesComponent', () => {
  let component: ProductRulesComponent;
  let fixture: ComponentFixture<ProductRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductRulesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
