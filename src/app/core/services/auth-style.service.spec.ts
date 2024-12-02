import { TestBed } from '@angular/core/testing';

import { AuthStyleService } from './auth-style.service';

describe('AuthStyleService', () => {
  let service: AuthStyleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthStyleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
