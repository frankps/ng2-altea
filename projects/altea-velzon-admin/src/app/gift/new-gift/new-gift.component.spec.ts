import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewGiftComponent } from './new-gift.component';

describe('NewGiftComponent', () => {
  let component: NewGiftComponent;
  let fixture: ComponentFixture<NewGiftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewGiftComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewGiftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
