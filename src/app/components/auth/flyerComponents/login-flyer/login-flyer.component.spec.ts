import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginFlyerComponent } from './login-flyer.component';

describe('LoginFlyerComponent', () => {
  let component: LoginFlyerComponent;
  let fixture: ComponentFixture<LoginFlyerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginFlyerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginFlyerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
