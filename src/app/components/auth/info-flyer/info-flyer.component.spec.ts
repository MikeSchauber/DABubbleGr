import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoFlyerComponent } from './info-flyer.component';

describe('InfoFlyerComponent', () => {
  let component: InfoFlyerComponent;
  let fixture: ComponentFixture<InfoFlyerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoFlyerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoFlyerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
