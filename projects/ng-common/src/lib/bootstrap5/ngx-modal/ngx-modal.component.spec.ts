import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxModalComponent } from './ngx-modal.component';

describe('NgxModalComponent', () => {
  let component: NgxModalComponent;
  let fixture: ComponentFixture<NgxModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NgxModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
