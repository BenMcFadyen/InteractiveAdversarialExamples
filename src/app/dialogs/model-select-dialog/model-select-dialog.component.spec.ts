import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelSelectDialogComponent } from './model-select-dialog.component';

describe('ModelSelectDialogComponent', () => {
  let component: ModelSelectDialogComponent;
  let fixture: ComponentFixture<ModelSelectDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModelSelectDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelSelectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
