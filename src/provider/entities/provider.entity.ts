import { PROVIDER_STATUS } from 'src/provider/enum/provider-status.enum';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Provider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  bio: string;

  @Column()
  businessPhone: string;

  @Column({
    type: 'enum',
    enum: PROVIDER_STATUS,
    default: PROVIDER_STATUS.PENDING_VERIFICATION,
  })
  status: PROVIDER_STATUS;

  @Column()
  address: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User, user => user.providerProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
