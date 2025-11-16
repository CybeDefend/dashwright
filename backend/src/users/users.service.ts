import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole, RoleType } from "../entities";
import { CreateUserDto, UpdateUserDto } from "../common/dto/user.dto";
import { PasswordUtil } from "../common/utils/password.util";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await PasswordUtil.hash(createUserDto.password);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ["organization", "roles"],
    });
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ["organization", "roles"],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    if (updateUserDto.password) {
      updateUserDto.password = await PasswordUtil.hash(updateUserDto.password);
    }

    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async assignRole(
    userId: string,
    role: RoleType,
    scope?: string,
  ): Promise<UserRole> {
    const userRole = this.userRoleRepository.create({
      userId,
      role,
      scope,
    });

    return this.userRoleRepository.save(userRole);
  }
}
