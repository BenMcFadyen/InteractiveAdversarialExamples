import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingDialogComponent } from './landing-dialog.component';

describe('LandingDialogComponent', () => {
  let component: LandingDialogComponent;
  let fixture: ComponentFixture<LandingDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LandingDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LandingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
