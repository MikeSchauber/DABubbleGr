import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupManagerComponent } from './popup-manager.component';

describe('PopupManagerComponent', () => {
  let component: PopupManagerComponent;
  let fixture: ComponentFixture<PopupManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
