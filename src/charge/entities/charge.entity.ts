import { Enrollments } from 'src/enrollments/entities/enrollment.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CHARGE_STATUS } from '../enum/charge-status.enum';

@Entity()
export class Charge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'decimal',
    scale: 2,
  })
  amount: number;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: CHARGE_STATUS,
    default: CHARGE_STATUS.PENDING,
  })
  status: CHARGE_STATUS;

  @Column({ type: 'date', nullable: true })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Enrollments, enrollment => enrollment.charges, {
    cascade: true,
  })
  enrollment: Enrollments;
}
