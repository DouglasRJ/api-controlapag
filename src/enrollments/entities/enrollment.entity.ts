import { ChargeException } from 'src/charge-exception/entities/charge-exception.entity';
import { ChargeSchedule } from 'src/charge-schedule/entities/charge-schedule.entity';
import { Charge } from 'src/charge/entities/charge.entity';
import { Client } from 'src/client/entities/client.entity';
import { Service } from 'src/services/entities/service.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ENROLLMENT_STATUS } from '../enum/enrollment-status.enum';

@Entity()
export class Enrollments {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'decimal',
    scale: 2,
  })
  price: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({
    type: 'enum',
    enum: ENROLLMENT_STATUS,
    default: ENROLLMENT_STATUS.ACTIVE,
  })
  status: ENROLLMENT_STATUS;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Service, service => service.enrollments)
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @ManyToOne(() => Client, client => client.enrollments)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @OneToOne(() => ChargeSchedule, chargeSchedule => chargeSchedule.enrollment)
  chargeSchedule: ChargeSchedule;

  @OneToMany(
    () => ChargeException,
    ChargeException => ChargeException.enrollment,
  )
  chargeExceptions: ChargeException[];

  @OneToMany(() => Charge, charge => charge.enrollment)
  charges: Charge[];
}
