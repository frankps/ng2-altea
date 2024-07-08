import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MySubsComponent } from './my-subs.component';

describe('MySubsComponent', () => {
  let component: MySubsComponent;
  let fixture: ComponentFixture<MySubsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MySubsComponent]
    });
    fixture = TestBed.createComponent(MySubsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
