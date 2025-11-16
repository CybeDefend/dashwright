import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { User } from "./user.entity";
import { Team } from "./team.entity";
import { TestRun } from "./test-run.entity";

@Entity("organizations")
export class Organization {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => User, (user) => user.organization, {
    cascade: true,
  })
  users: User[];

  @OneToMany(() => Team, (team) => team.organization, {
    cascade: true,
  })
  teams: Team[];

  @OneToMany(() => TestRun, (testRun) => testRun.organization)
  testRuns: TestRun[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
