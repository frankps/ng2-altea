import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageGiftsComponent } from './manage-gifts.component';

describe('ManageGiftsComponent', () => {
  let component: ManageGiftsComponent;
  let fixture: ComponentFixture<ManageGiftsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManageGiftsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageGiftsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
