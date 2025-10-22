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
import { SERVICE_FREQUENCY } from '../enum/service-frequency.enum';

@Entity()
export class ServiceSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Enrollments, enrollment => enrollment.serviceSchedule, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  enrollment: Enrollments;

  @Column({ type: 'enum', enum: SERVICE_FREQUENCY })
  frequency: SERVICE_FREQUENCY;

  @Column('simple-array', { nullable: true })
  daysOfWeek?: number[];

  @Column({ type: 'integer', nullable: true })
  dayOfMonth?: number;

  @Column({ type: 'time', nullable: true })
  startTime?: string;

  @Column({ type: 'time', nullable: true })
  endTime?: string;
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
