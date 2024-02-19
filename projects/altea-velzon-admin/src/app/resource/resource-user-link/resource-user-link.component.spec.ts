import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceUserLinkComponent } from './resource-user-link.component';

describe('ResourceUserLinkComponent', () => {
  let component: ResourceUserLinkComponent;
  let fixture: ComponentFixture<ResourceUserLinkComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ResourceUserLinkComponent]
    });
    fixture = TestBed.createComponent(ResourceUserLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
