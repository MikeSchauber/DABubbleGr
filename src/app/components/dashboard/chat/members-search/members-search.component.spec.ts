import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembersSearchComponent } from './members-search.component';

describe('MembersSearchComponent', () => {
  let component: MembersSearchComponent;
  let fixture: ComponentFixture<MembersSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembersSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembersSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
