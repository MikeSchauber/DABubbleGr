import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditChannelPopupComponent } from './edit-channel-popup.component';

describe('EditChannelPopupComponent', () => {
  let component: EditChannelPopupComponent;
  let fixture: ComponentFixture<EditChannelPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditChannelPopupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditChannelPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
