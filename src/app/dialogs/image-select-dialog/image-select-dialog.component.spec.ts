import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageSelectDialogComponent } from './image-select-dialog.component';

describe('ImageSelectDialogComponent', () => {
  let component: ImageSelectDialogComponent;
  let fixture: ComponentFixture<ImageSelectDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImageSelectDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageSelectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
