import { Test, TestingModule } from '@nestjs/testing';
import { ChargeScheduleService } from './charge-schedule.service';

describe('ChargeScheduleService', () => {
  let service: ChargeScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChargeScheduleService],
    }).compile();

    service = module.get<ChargeScheduleService>(ChargeScheduleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
