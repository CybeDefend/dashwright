import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { TestRun } from "./test-run.entity";

export enum TestStatus {
  PASSED = "passed",
  FAILED = "failed",
  SKIPPED = "skipped",
  FLAKY = "flaky",
}

@Entity("tests")
export class Test {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 500 })
  name: string;

  @Column({
    type: "enum",
    enum: TestStatus,
  })
  status: TestStatus;

  @Column({ type: "int", nullable: true })
  duration: number;

  @Column({ type: "text", nullable: true })
  errorMessage: string;

  @Column({ type: "text", nullable: true })
  errorStack: string;

  @Column({ type: "int", default: 1 })
  retries: number;

  @ManyToOne(() => TestRun, (testRun) => testRun.tests, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "testRunId" })
  testRun: TestRun;

  @Column()
  testRunId: string;

  @CreateDateColumn()
  createdAt: Date;
}
