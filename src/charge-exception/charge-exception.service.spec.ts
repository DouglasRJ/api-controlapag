import { Test, TestingModule } from '@nestjs/testing';
import { ChargeExceptionService } from './charge-exception.service';

describe('ChargeExceptionService', () => {
  let service: ChargeExceptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChargeExceptionService],
    }).compile();

    service = module.get<ChargeExceptionService>(ChargeExceptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
