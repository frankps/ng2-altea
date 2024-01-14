import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UseGiftComponent } from './use-gift.component';

describe('UseGiftComponent', () => {
  let component: UseGiftComponent;
  let fixture: ComponentFixture<UseGiftComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UseGiftComponent]
    });
    fixture = TestBed.createComponent(UseGiftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
