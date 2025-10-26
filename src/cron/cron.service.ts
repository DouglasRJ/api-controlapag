import { Injectable, Logger } from '@nestjs/common';
import { ChargeService } from 'src/charge/charge.service';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly enrollmentsService: EnrollmentsService,
    private readonly chargeService: ChargeService,
  ) {}

  // async createDailyCharges() {
  //   this.logger.log('Starting daily charge creation job.');

  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //   const enrollments = await this.enrollmentsService.findAllNeedsCharge();

  //   let createdChargesCount = 0;

  //   for (const enrollment of enrollments) {
  //     if (!enrollment.chargeSchedule) {
  //       this.logger.warn(
  //         `Enrollment ID: ${enrollment.id} has no charge schedule. Skipping.`,
  //       );
  //       continue;
  //     }

  //     const exception = enrollment.chargeExceptions.find(
  //       ex => new Date(ex.originalChargeDate).getTime() === today.getTime(),
  //     );

  //     if (exception) {
  //       this.logger.log(
  //         `Handling exception for enrollment ID: ${enrollment.id}. Action: ${exception.action}`,
  //       );

  //       if (exception.action === EXCEPTION_ACTION.SKIP) {
  //         continue;
  //       }

  //       const chargeAmount = exception.newAmount ?? enrollment.price;
  //       const dueDate: Date =
  //         exception.action === EXCEPTION_ACTION.POSTPONE
  //           ? exception.newDueDate!
  //           : today;

  //       const chargeExists = await this.chargeExistsForDate(
  //         enrollment.id,
  //         dueDate,
  //       );

  //       if (chargeExists) {
  //         this.logger.warn(
  //           `Charge already exists for enrollment ID: ${enrollment.id} on date ${dueDate.toString()}. Skipping exception charge.`,
  //         );
  //         continue;
  //       }

  //       await this.createCharge(
  //         enrollment.id,
  //         chargeAmount,
  //         dueDate.toISOString(),
  //       );
  //       createdChargesCount++;
  //       continue;
  //     }

  //     const chargeExists = await this.chargeExistsForDate(enrollment.id, today);
  //     if (chargeExists) {
  //       this.logger.log(
  //         `Charge already exists for enrollment ID: ${enrollment.id} for today. Skipping.`,
  //       );
  //       continue;
  //     }

  //     const { billingModel, chargeDay, recurrenceInterval, dueDate } =
  //       enrollment.chargeSchedule;
  //     const startDate = new Date(enrollment.startDate);

  //     let shouldCreateCharge = false;

  //     if (billingModel === BILLING_MODEL.ONE_TIME) {
  //       if (new Date(dueDate).getTime() === today.getTime()) {
  //         shouldCreateCharge = true;
  //       }
  //     } else if (billingModel === BILLING_MODEL.RECURRING) {
  //       const monthDiff =
  //         (today.getFullYear() - startDate.getFullYear()) * 12 +
  //         (today.getMonth() - startDate.getMonth());

  //       switch (recurrenceInterval) {
  //         case RECURRENCE_INTERVAL.WEEKLY:
  //           if (today.getDay() === startDate.getDay()) {
  //             shouldCreateCharge = true;
  //           }
  //           break;
  //         case RECURRENCE_INTERVAL.MONTHLY:
  //           if (today.getDate() === chargeDay) {
  //             shouldCreateCharge = true;
  //           }
  //           break;
  //         case RECURRENCE_INTERVAL.BIMONTHLY:
  //           if (
  //             today.getDate() === chargeDay &&
  //             monthDiff > 0 &&
  //             monthDiff % 2 === 0
  //           ) {
  //             shouldCreateCharge = true;
  //           }
  //           break;
  //         case RECURRENCE_INTERVAL.TRIMESTERLY:
  //           if (
  //             today.getDate() === chargeDay &&
  //             monthDiff > 0 &&
  //             monthDiff % 3 === 0
  //           ) {
  //             shouldCreateCharge = true;
  //           }
  //           break;
  //         case RECURRENCE_INTERVAL.SEMIANNUALLY:
  //           if (
  //             today.getDate() === chargeDay &&
  //             monthDiff > 0 &&
  //             monthDiff % 6 === 0
  //           ) {
  //             shouldCreateCharge = true;
  //           }
  //           break;
  //         case RECURRENCE_INTERVAL.YEARLY:
  //           if (
  //             today.getDate() === chargeDay &&
  //             today.getMonth() === startDate.getMonth() &&
  //             monthDiff > 0 &&
  //             monthDiff % 12 === 0
  //           ) {
  //             shouldCreateCharge = true;
  //           }
  //           break;
  //       }
  //     }

  //     if (shouldCreateCharge) {
  //       await this.createCharge(
  //         enrollment.id,
  //         enrollment.price,
  //         today.toISOString(),
  //       );
  //       createdChargesCount++;
  //     }
  //   }

  //   this.logger.log(
  //     `Daily charge creation job finished. Total charges created: ${createdChargesCount}`,
  //   );
  //   return {
  //     message: 'Daily charge creation process finished.',
  //     createdCharges: createdChargesCount,
  //     totalEnrollmentsProcessed: enrollments.length,
  //   };
  // }

  // private async chargeExistsForDate(
  //   enrollmentId: string,
  //   date: Date,
  // ): Promise<boolean> {
  //   const count = await this.chargeService.countByEnrollmentIdByDate({
  //     enrollmentId,
  //     date,
  //   });
  //   return count > 0;
  // }

  // private async createCharge(
  //   enrollmentId: string,
  //   amount: number,
  //   dueDate: string,
  // ) {
  //   try {
  //     await this.chargeService.create({
  //       enrollmentId,
  //       createChargeDto: { amount, dueDate },
  //     });
  //     this.logger.log(
  //       `Charge created for enrollment ID: ${enrollmentId} with due date ${dueDate}`,
  //     );
  //   } catch (error) {
  //     this.logger.error(
  //       `Failed to create charge for enrollment ID: ${enrollmentId}`,
  //       error,
  //     );
  //   }
  // }
}
