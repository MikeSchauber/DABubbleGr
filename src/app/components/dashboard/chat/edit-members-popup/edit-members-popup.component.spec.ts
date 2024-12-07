import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditMembersPopupComponent } from './edit-members-popup.component';

describe('EditMembersPopupComponent', () => {
  let component: EditMembersPopupComponent;
  let fixture: ComponentFixture<EditMembersPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditMembersPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditMembersPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
