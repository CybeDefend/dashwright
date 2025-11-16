import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Team, User } from "../entities";
import { CreateTeamDto, UpdateTeamDto } from "../common/dto/team.dto";

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createTeamDto: CreateTeamDto): Promise<Team> {
    const team = this.teamRepository.create({
      name: createTeamDto.name,
      description: createTeamDto.description,
      organizationId: createTeamDto.organizationId,
      isActive: createTeamDto.isActive,
    });

    if (createTeamDto.memberIds && createTeamDto.memberIds.length > 0) {
      team.members = await this.userRepository.findBy({
        id: In(createTeamDto.memberIds),
      });
    }

    return this.teamRepository.save(team);
  }

  async findAll(): Promise<Team[]> {
    return this.teamRepository.find({
      relations: ["organization", "members"],
    });
  }

  async findOne(id: string): Promise<Team | null> {
    return this.teamRepository.findOne({
      where: { id },
      relations: ["organization", "members"],
    });
  }

  async update(id: string, updateTeamDto: UpdateTeamDto): Promise<Team | null> {
    const team = await this.teamRepository.findOne({
      where: { id },
      relations: ["members"],
    });

    if (!team) return null;

    if (updateTeamDto.name) team.name = updateTeamDto.name;
    if (updateTeamDto.description !== undefined)
      team.description = updateTeamDto.description;
    if (updateTeamDto.isActive !== undefined)
      team.isActive = updateTeamDto.isActive;

    if (updateTeamDto.memberIds) {
      team.members = await this.userRepository.findBy({
        id: In(updateTeamDto.memberIds),
      });
    }

    return this.teamRepository.save(team);
  }

  async remove(id: string): Promise<void> {
    await this.teamRepository.delete(id);
  }
}
