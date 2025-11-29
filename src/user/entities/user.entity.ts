import { Client } from 'src/client/entities/client.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Provider } from '../../provider/entities/provider.entity';
import { USER_ROLE } from '../enum/user-role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'enum', enum: USER_ROLE })
  role: USER_ROLE;

  @Column({
    type: 'text',
    nullable: true,
  })
  image?: string | undefined;

  @Column({ nullable: true })
  organizationId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Provider, provider => provider.user, { nullable: true })
  providerProfile: Provider;

  @OneToOne(() => Client, client => client.user, { nullable: true })
  clientProfile: Client;
}
