import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductResourcesComponent } from './product-resources.component';

describe('ProductResourcesComponent', () => {
  let component: ProductResourcesComponent;
  let fixture: ComponentFixture<ProductResourcesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductResourcesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductResourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
