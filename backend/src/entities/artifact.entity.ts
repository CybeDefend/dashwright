import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { TestRun } from "./test-run.entity";

export enum ArtifactType {
  SCREENSHOT = "screenshot",
  VIDEO = "video",
  LOG = "log",
  TRACE = "trace",
  OTHER = "other",
}

@Entity("artifacts")
export class Artifact {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  filename: string;

  @Column({
    type: "enum",
    enum: ArtifactType,
    default: ArtifactType.OTHER,
  })
  type: ArtifactType;

  @Column({ length: 255 })
  mimeType: string;

  @Column({ type: "bigint" })
  size: number;

  @Column({ type: "text" })
  storageKey: string;

  @Column({ length: 255, nullable: true })
  testName: string;

  @ManyToOne(() => TestRun, (testRun) => testRun.artifacts, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "testRunId" })
  testRun: TestRun;

  @Column()
  testRunId: string;

  @CreateDateColumn()
  createdAt: Date;
}
