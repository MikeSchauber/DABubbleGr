import { TestBed } from '@angular/core/testing';

import { InfoFlyerService } from './info-flyer.service';

describe('InfoFlyerService', () => {
  let service: InfoFlyerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InfoFlyerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
