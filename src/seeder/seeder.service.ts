import { faker } from '@faker-js/faker/locale/pt_BR';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateClientDto } from 'src/client/dto/create-client.dto';
import { Client } from 'src/client/entities/client.entity';
import { HashService } from 'src/common/hash/hash.service';
import { CreateEnrollmentDto } from 'src/enrollments/dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from 'src/enrollments/dto/update-enrollment.dto';
import { ENROLLMENT_STATUS } from 'src/enrollments/enum/enrollment-status.enum';
import { CreateProviderDto } from 'src/provider/dto/create-provider.dto';
import { Provider } from 'src/provider/entities/provider.entity';
import { CreateServiceDto } from 'src/services/dto/create-service.dto';
import { Service } from 'src/services/entities/service.entity';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { BILLING_MODEL } from '../charge-schedule/enum/billing-model.enum';
import { RECURRENCE_INTERVAL } from '../charge-schedule/enum/recurrence-interval.enum';
import { ClientService } from '../client/client.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { SERVICE_FREQUENCY } from '../service-schedule/enum/service-frequency.enum';
import { ServicesService } from '../services/services.service';
import { USER_ROLE } from '../user/enum/user-role.enum';
import { UserService } from '../user/user.service';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);
  private readonly defaultPassword = 'Password123!';

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly clientService: ClientService,
    private readonly servicesService: ServicesService,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly hashService: HashService,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Client) private clientRepository: Repository<Client>,
  ) {}

  async seed(
    numProviders = 2,
    numClientsPerProvider = 5,
    numServicesPerProvider = 3,
    numEnrollmentsPerClient = 2,
  ) {
    this.logger.log('Starting seeding process...');

    const createdProviders: Provider[] = [];
    const createdClients: Client[] = [];
    const createdServices: Service[] = [];

    for (let i = 0; i < numProviders; i++) {
      let providerEmail = '';
      try {
        providerEmail = faker.internet.email().toLowerCase();
        const providerDto: CreateProviderDto = {
          username: faker.internet.username().toLowerCase() + i,
          email: providerEmail,
          password: this.defaultPassword,
          role: USER_ROLE.PROVIDER,
          title: faker.company.name(),
          bio: faker.lorem.paragraph(),
          businessPhone: faker.phone.number(),
          address: faker.location.streetAddress(true),
        };
        const providerProfile = await this.authService.createProvider({
          createUserDto: providerDto,
        });
        createdProviders.push(providerProfile);
        this.logger.log(`Provider created: ${providerDto.email}`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (
          message.includes('Email already exists') ||
          message.includes(
            'duplicate key value violates unique constraint "UQ_e12875dfb3b1d92d7d7c5377e22"',
          )
        ) {
          this.logger.warn(
            `Skipping provider due to duplicate email (${providerEmail}): ${message}`,
          );
        } else {
          this.logger.error(
            `Failed to create provider: ${message}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }
    }

    if (createdProviders.length === 0) {
      this.logger.error('No providers were created. Seeding cannot continue.');
      return;
    }

    for (const providerProfile of createdProviders) {
      const providerUser = await this.userService.findOneByOrFail({
        id: providerProfile.user.id,
      });

      const providerClients: Client[] = [];
      for (let j = 0; j < numClientsPerProvider; j++) {
        let clientEmail = '';
        try {
          clientEmail = faker.internet.email().toLowerCase();
          const clientUserDto: CreateClientDto = {
            username: faker.internet.username().toLowerCase() + j,
            email: clientEmail,
            password: this.defaultPassword,
            role: USER_ROLE.CLIENT,
            phone: faker.phone.number(),
            address: faker.location.streetAddress(true),
          };

          const createdClientProfile = await this.authService.createClient({
            createUserDto: clientUserDto,
          });

          const fullClientProfile = await this.clientService.findOneByOrFail(
            { id: createdClientProfile.id },
            false,
          );

          if (!fullClientProfile.user) {
            throw new Error(
              `User relation not loaded for client ${createdClientProfile.id}`,
            );
          }

          providerClients.push(fullClientProfile);
          createdClients.push(fullClientProfile);
          this.logger.log(
            `Client created: ${clientUserDto.email} for Provider ${providerUser.email}`,
          );
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : String(error);
          if (
            message.includes('Email already exists') ||
            message.includes(
              'duplicate key value violates unique constraint "UQ_e12875dfb3b1d92d7d7c5377e22"',
            )
          ) {
            this.logger.warn(
              `Skipping client due to duplicate email (${clientEmail}): ${message}`,
            );
          } else {
            this.logger.error(
              `Failed to create client for provider ${providerUser.email}: ${message}`,
              error instanceof Error ? error.stack : undefined,
            );
          }
        }
      }

      const providerServices: Service[] = [];
      for (let k = 0; k < numServicesPerProvider; k++) {
        try {
          const serviceDto: CreateServiceDto = {
            name: faker.commerce.productName() + ` ${k}`,
            description: faker.lorem.sentence(),
            defaultPrice: parseFloat(
              faker.commerce.price({ min: 20, max: 1000, dec: 2 }),
            ),
            address: faker.helpers.maybe(
              () => faker.location.secondaryAddress(),
              { probability: 0.5 },
            ),
            allowedPaymentMethods: faker.helpers.arrayElements(
              ['PIX', 'CREDIT_CARD', 'CASH', 'BANK_SLIP'],
              { min: 1, max: 4 },
            ) as any,
          };
          const service = await this.servicesService.create({
            userId: providerUser.id,
            createServiceDto: serviceDto,
          });
          providerServices.push(service);
          createdServices.push(service);
          this.logger.log(
            `Service created: ${service.name} for Provider ${providerUser.email}`,
          );
        } catch (error: unknown) {
          this.logger.error(
            `Failed to create service for provider ${providerUser.email}: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }

      if (providerServices.length === 0) continue;

      for (const clientProfile of providerClients) {
        const clientUser = clientProfile.user;
        if (!clientUser) {
          this.logger.warn(
            `Skipping enrollments for client profile ${clientProfile.id} because user is missing.`,
          );
          continue;
        }

        const numEnrollments = faker.number.int({
          min: 1,
          max: Math.min(numEnrollmentsPerClient, providerServices.length),
        });
        const servicesToEnroll = faker.helpers.arrayElements(
          providerServices,
          numEnrollments,
        );

        for (const service of servicesToEnroll) {
          try {
            const startDate = faker.date.between({
              from: '2024-01-01T00:00:00.000Z',
              to: '2025-12-31T00:00:00.000Z',
            });
            const hasEndDate = faker.datatype.boolean({ probability: 0.7 });
            const endDate = hasEndDate
              ? faker.date.future({ years: 1, refDate: startDate })
              : undefined;

            const intendedStatus =
              hasEndDate && endDate && endDate < new Date()
                ? ENROLLMENT_STATUS.COMPLETED
                : faker.helpers.arrayElement([
                    ENROLLMENT_STATUS.ACTIVE,
                    ENROLLMENT_STATUS.INACTIVE,
                    ENROLLMENT_STATUS.CANCELLED,
                  ]);

            const isRecurringBilling = faker.datatype.boolean({
              probability: 0.8,
            });
            const serviceFrequency = faker.helpers.arrayElement(
              Object.values(SERVICE_FREQUENCY),
            );

            const enrollmentDto: CreateEnrollmentDto = {
              price: service.defaultPrice
                ? service.defaultPrice *
                  faker.number.float({ min: 0.8, max: 1.1 })
                : faker.number.float({ min: 50, max: 800 }),
              startDate: startDate,
              endDate: endDate,
              serviceId: service.id,
              clientId: clientProfile.id,
              chargeSchedule: {
                billingModel: isRecurringBilling
                  ? BILLING_MODEL.RECURRING
                  : BILLING_MODEL.ONE_TIME,
                recurrenceInterval: isRecurringBilling
                  ? faker.helpers.arrayElement(
                      Object.values(RECURRENCE_INTERVAL),
                    )
                  : undefined,
                chargeDay: faker.number.int({ min: 1, max: 28 }),
                dueDate: !isRecurringBilling
                  ? faker.date.soon({ days: 30, refDate: startDate })
                  : undefined,
              },
              serviceSchedule: {
                frequency: serviceFrequency,
                daysOfWeek:
                  serviceFrequency === SERVICE_FREQUENCY.WEEKLY
                    ? faker.helpers.arrayElements([0, 1, 2, 3, 4, 5, 6], {
                        min: 1,
                        max: 5,
                      })
                    : undefined,
                dayOfMonth:
                  serviceFrequency === SERVICE_FREQUENCY.MONTHLY
                    ? faker.number.int({ min: 1, max: 28 })
                    : undefined,
                startTime: faker.helpers.maybe(
                  () =>
                    `${faker.number.int({ min: 7, max: 10 }).toString().padStart(2, '0')}:00:00`,
                  { probability: 0.7 },
                ),
                endTime: faker.helpers.maybe(
                  () =>
                    `${faker.number.int({ min: 16, max: 19 }).toString().padStart(2, '0')}:00:00`,
                  { probability: 0.7 },
                ),
              },
            };
            const createdEnrollment = await this.enrollmentsService.create({
              userId: providerUser.id,
              createEnrollmentDto: enrollmentDto,
            });

            if (
              createdEnrollment.status !== intendedStatus &&
              intendedStatus !== ENROLLMENT_STATUS.ACTIVE
            ) {
              const updateDto: UpdateEnrollmentDto = { status: intendedStatus };
              await this.enrollmentsService.update({
                enrollmentsId: createdEnrollment.id,
                userId: providerUser.id,
                updateEnrollmentDto: updateDto,
              });
            }

            this.logger.log(
              `Enrollment created for Client ${clientUser.email} in Service ${service.name} with status ${intendedStatus}`,
            );
          } catch (error: unknown) {
            this.logger.error(
              `Failed to create enrollment for client ${clientUser.email} in service ${service.name}: ${error instanceof Error ? error.message : String(error)}`,
              error instanceof Error ? error.stack : undefined,
            );
          }
        }
      }
    }

    this.logger.log('Seeding finished.');
    this.logger.log(
      `Created: ${createdProviders.length} Providers, ${createdClients.length} Clients, ${createdServices.length} Services.`,
    );
  }
}
