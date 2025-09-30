import { RECURRENCE_INTERVAL } from 'src/charge-schedule/enum/recurrence-interval.enum';
import { Enrollments } from 'src/enrollments/entities/enrollment.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BILLING_MODEL } from '../enum/billing-model.enum';

@Entity()
export class ChargeSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: BILLING_MODEL })
  billingModel: BILLING_MODEL;

  @Column({ type: 'enum', enum: RECURRENCE_INTERVAL, nullable: true })
  recurrenceInterval?: RECURRENCE_INTERVAL;

  @Column({ type: 'integer' })
  chargeDay: number;

  @Column({ type: 'date', nullable: true })
  dueDate?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Enrollments, enrollment => enrollment.chargeSchedule, {
    cascade: true,
  })
  @JoinColumn()
  enrollment: Enrollments;
}
