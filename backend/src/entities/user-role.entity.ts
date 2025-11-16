import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum RoleType {
  ADMIN = 'admin',
  MAINTAINER = 'maintainer',
  VIEWER = 'viewer',
}

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RoleType,
    default: RoleType.VIEWER,
  })
  role: RoleType;

  @ManyToOne(() => User, (user) => user.roles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ length: 255, nullable: true })
  scope: string;

  @CreateDateColumn()
  createdAt: Date;
}
