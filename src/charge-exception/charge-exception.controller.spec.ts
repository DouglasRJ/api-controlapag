import { Test, TestingModule } from '@nestjs/testing';
import { ChargeExceptionController } from './charge-exception.controller';
import { ChargeExceptionService } from './charge-exception.service';

describe('ChargeExceptionController', () => {
  let controller: ChargeExceptionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChargeExceptionController],
      providers: [ChargeExceptionService],
    }).compile();

    controller = module.get<ChargeExceptionController>(ChargeExceptionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
