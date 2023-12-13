import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditProductResourceComponent } from './edit-product-resource.component';

describe('EditProductResourceComponent', () => {
  let component: EditProductResourceComponent;
  let fixture: ComponentFixture<EditProductResourceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditProductResourceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditProductResourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
