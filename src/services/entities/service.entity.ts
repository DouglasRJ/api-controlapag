import { Enrollments } from 'src/enrollments/entities/enrollment.entity';
import { Provider } from 'src/provider/entities/provider.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({
    type: 'decimal',
    scale: 2,
    nullable: true,
  })
  defaultPrice?: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Provider, provider => provider.services)
  @JoinColumn({ name: 'providerId' })
  provider: Provider;

  @OneToMany(() => Enrollments, enrollments => enrollments.service, {
    cascade: true,
  })
  enrollments: Enrollments[];
}
