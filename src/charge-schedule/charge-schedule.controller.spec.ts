import { Test, TestingModule } from '@nestjs/testing';
import { ChargeScheduleController } from './charge-schedule.controller';
import { ChargeScheduleService } from './charge-schedule.service';

describe('ChargeScheduleController', () => {
  let controller: ChargeScheduleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChargeScheduleController],
      providers: [ChargeScheduleService],
    }).compile();

    controller = module.get<ChargeScheduleController>(ChargeScheduleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
