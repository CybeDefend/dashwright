import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { RoleType } from './user-role.entity';
import { randomBytes } from 'crypto';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string;

  @Column()
  email: string;

  @Column({
    type: 'enum',
    enum: RoleType,
    default: RoleType.VIEWER,
  })
  role: RoleType;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  organizationId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invitedById' })
  invitedBy: User;

  @Column({ nullable: true })
  invitedById: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'acceptedByUserId' })
  acceptedByUser: User;

  @Column({ nullable: true })
  acceptedByUserId: string;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateToken() {
    if (!this.token) {
      this.token = randomBytes(32).toString('hex');
    }
    if (!this.expiresAt) {
      // Expire in 7 days by default
      this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
  }
}
