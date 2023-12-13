import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductRuleComponent } from './product-rule.component';

describe('ProductRuleComponent', () => {
  let component: ProductRuleComponent;
  let fixture: ComponentFixture<ProductRuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductRuleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
