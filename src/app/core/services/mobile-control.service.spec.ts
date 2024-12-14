import { TestBed } from '@angular/core/testing';

import { MobileControlService } from './mobile-control.service';

describe('MobileControlService', () => {
  let service: MobileControlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MobileControlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
