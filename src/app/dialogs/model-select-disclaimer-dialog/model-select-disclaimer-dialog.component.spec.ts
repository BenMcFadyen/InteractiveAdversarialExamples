import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelSelectDisclaimerDialogComponent } from './model-select-disclaimer-dialog.component';

describe('ModelSelectDisclaimerDialogComponent', () => {
  let component: ModelSelectDisclaimerDialogComponent;
  let fixture: ComponentFixture<ModelSelectDisclaimerDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModelSelectDisclaimerDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelSelectDisclaimerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
