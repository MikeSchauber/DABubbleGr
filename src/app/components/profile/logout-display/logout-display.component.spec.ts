import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogoutDisplayComponent } from './logout-display.component';

describe('LogoutDisplayComponent', () => {
  let component: LogoutDisplayComponent;
  let fixture: ComponentFixture<LogoutDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoutDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogoutDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
