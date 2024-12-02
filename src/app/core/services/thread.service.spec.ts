import { TestBed } from '@angular/core/testing';

import { ThreadServiceService } from './thread.service';

describe('ThreadServiceService', () => {
  let service: ThreadServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThreadServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
