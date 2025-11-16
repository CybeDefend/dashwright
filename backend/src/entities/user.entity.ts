import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { UserRole } from "./user-role.entity";
import { TestRun } from "./test-run.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 255 })
  username: string;

  @Column({ unique: true, length: 255, nullable: true })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 255, nullable: true })
  fullName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "timestamp", nullable: true })
  lastLoginAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.users, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @Column()
  organizationId: string;

  @OneToMany(() => UserRole, (userRole) => userRole.user, {
    cascade: true,
  })
  roles: UserRole[];

  @OneToMany(() => TestRun, (testRun) => testRun.createdBy)
  testRuns: TestRun[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
