import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateBranchComponent } from './create-branch.component';

describe('CreateBranchComponent', () => {
  let component: CreateBranchComponent;
  let fixture: ComponentFixture<CreateBranchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateBranchComponent]
    });
    fixture = TestBed.createComponent(CreateBranchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
