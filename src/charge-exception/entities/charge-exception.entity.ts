import { Enrollments } from 'src/enrollments/entities/enrollment.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EXCEPTION_ACTION } from '../enum/exception-action.enum';

@Entity()
export class ChargeException {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  originalChargeDate: Date;

  @Column({ type: 'enum', enum: EXCEPTION_ACTION })
  action: EXCEPTION_ACTION;

  @Column({ type: 'date', nullable: true })
  newDueDate?: Date;

  @Column({ type: 'decimal', scale: 2, nullable: true })
  newAmount?: number;

  @Column({ type: 'text' })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Enrollments, enrollment => enrollment.chargeExceptions, {
    onDelete: 'CASCADE',
  })
  enrollment: Enrollments;
}
