import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeederModule } from 'src/seeder/seeder.module';
import { SeederService } from 'src/seeder/seeder.service';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(SeederModule);
  const logger = new Logger('Seeder');

  const seeder = appContext.get(SeederService);

  try {
    logger.log('Starting database seeding...');
    await seeder.seed(3, 8, 5, 3);
    logger.log('Seeding completed successfully.');
  } catch (error) {
    logger.error('Seeding failed!');
    logger.error(error);
  } finally {
    await appContext.close();
  }
}

void bootstrap();
