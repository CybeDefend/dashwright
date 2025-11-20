import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, Organization, UserRole, RoleType } from "../entities";
import { PasswordUtil } from "../common/utils/password.util";
import { AuthResponseDto, RegisterDto } from "../common/dto/auth.dto";
import { SystemSettingsService } from "../services/system-settings.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private systemSettingsService: SystemSettingsService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ["roles", "organization"],
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await PasswordUtil.verify(user.password, password);

    if (!isPasswordValid) {
      return null;
    }

    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    return user;
  }

  async login(user: User): Promise<AuthResponseDto> {
    const payload = { username: user.username, sub: user.id };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get("JWT_EXPIRES_IN", "1h"),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get("JWT_REFRESH_SECRET"),
      expiresIn: this.configService.get("JWT_REFRESH_EXPIRES_IN", "7d"),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        organizationId: user.organizationId,
        isSuperAdmin: user.isSuperAdmin,
        roles: user.roles?.map(role => ({
          id: role.id,
          role: role.role,
        })),
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get("JWT_REFRESH_SECRET"),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ["roles", "organization"],
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      return this.login(user);
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if this is the first user (will be super admin)
    const userCount = await this.userRepository.count();
    const isFirstUser = userCount === 0;

    // If not the first user, check if registration is enabled
    if (!isFirstUser) {
      const registrationEnabled =
        await this.systemSettingsService.isRegistrationEnabled();
      if (!registrationEnabled) {
        throw new ForbiddenException("Registration is currently disabled");
      }
    }

    // Check if username already exists
    const existingUser = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingUser) {
      throw new ConflictException("Username already exists");
    }

    // Check if email already exists (if provided)
    if (registerDto.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: registerDto.email },
      });

      if (existingEmail) {
        throw new ConflictException("Email already exists");
      }
    }

    // Create organization
    const organization = this.organizationRepository.create({
      name: registerDto.organizationName,
      description: `Organization for ${registerDto.username}`,
    });
    await this.organizationRepository.save(organization);

    // Hash password
    const hashedPassword = await PasswordUtil.hash(registerDto.password);

    // Create user
    const user = this.userRepository.create({
      username: registerDto.username,
      email: registerDto.email,
      password: hashedPassword,
      fullName: registerDto.fullName || registerDto.username,
      organizationId: organization.id,
      isActive: true,
      isSuperAdmin: isFirstUser, // First user becomes super admin
    });
    await this.userRepository.save(user);

    // Assign admin role
    const userRole = this.userRoleRepository.create({
      userId: user.id,
      role: RoleType.ADMIN,
      scope: "organization",
    });
    await this.userRoleRepository.save(userRole);

    // Return auth tokens
    return this.login(user);
  }

  async isRegistrationEnabled(): Promise<boolean> {
    return this.systemSettingsService.isRegistrationEnabled();
  }

  async needsSetup(): Promise<boolean> {
    const userCount = await this.userRepository.count();
    return userCount === 0;
  }
}
