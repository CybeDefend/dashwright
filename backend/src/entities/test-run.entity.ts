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
import { User } from "./user.entity";
import { Organization } from "./organization.entity";
import { Artifact } from "./artifact.entity";
import { Test } from "./test.entity";

export enum TestRunStatus {
  RUNNING = "running",
  PASSED = "passed",
  FAILED = "failed",
  SKIPPED = "skipped",
}

@Entity("test_runs")
export class TestRun {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({
    type: "enum",
    enum: TestRunStatus,
    default: TestRunStatus.RUNNING,
  })
  status: TestRunStatus;

  @Column({ type: "int", default: 0 })
  totalTests: number;

  @Column({ type: "int", default: 0 })
  passedTests: number;

  @Column({ type: "int", default: 0 })
  failedTests: number;

  @Column({ type: "int", default: 0 })
  skippedTests: number;

  @Column({ type: "bigint", nullable: true })
  duration: number;

  @Column({ type: "timestamp", nullable: true })
  startedAt: Date;

  @Column({ type: "timestamp", nullable: true })
  finishedAt: Date;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any>;

  @Column({ type: "text", nullable: true })
  logs: string;

  @Column({ length: 255, nullable: true })
  branch: string;

  @Column({ length: 255, nullable: true })
  commit: string;

  @Column({ length: 255, nullable: true })
  environment: string;

  @ManyToOne(() => Organization, (organization) => organization.testRuns, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @Column()
  organizationId: string;

  @ManyToOne(() => User, (user) => user.testRuns, {
    nullable: true,
  })
  @JoinColumn({ name: "createdById" })
  createdBy: User;

  @Column({ nullable: true })
  createdById: string;

  @OneToMany(() => Artifact, (artifact) => artifact.testRun, {
    cascade: true,
  })
  artifacts: Artifact[];

  @OneToMany(() => Test, (test) => test.testRun, {
    cascade: true,
  })
  tests: Test[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
