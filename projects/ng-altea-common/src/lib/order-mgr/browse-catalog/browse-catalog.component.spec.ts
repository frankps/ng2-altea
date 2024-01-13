import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowseCatalogComponent } from './browse-catalog.component';

describe('BrowseCatalogComponent', () => {
  let component: BrowseCatalogComponent;
  let fixture: ComponentFixture<BrowseCatalogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BrowseCatalogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BrowseCatalogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
