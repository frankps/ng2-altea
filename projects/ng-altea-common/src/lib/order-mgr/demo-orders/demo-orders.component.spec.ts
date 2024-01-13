import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DemoOrdersComponent } from './demo-orders.component';

describe('DemoOrdersComponent', () => {
  let component: DemoOrdersComponent;
  let fixture: ComponentFixture<DemoOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DemoOrdersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
