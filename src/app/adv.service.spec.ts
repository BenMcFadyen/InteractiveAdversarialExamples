import { TestBed } from '@angular/core/testing';

import { AdvService } from './adv.service';

describe('AdvService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AdvService = TestBed.get(AdvService);
    expect(service).toBeTruthy();
  });
});
