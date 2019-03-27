import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelsLoadedDialogComponent } from './models-loaded-dialog.component';

describe('ModelsLoadedDialogComponent', () => {
  let component: ModelsLoadedDialogComponent;
  let fixture: ComponentFixture<ModelsLoadedDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModelsLoadedDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelsLoadedDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
