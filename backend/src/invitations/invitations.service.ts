import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Invitation, InvitationStatus } from "../entities/invitation.entity";
import { User } from "../entities/user.entity";
import {
  CreateInvitationDto,
  AcceptInvitationDto,
} from "../common/dto/invitation.dto";
import * as argon2 from "argon2";

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private invitationsRepository: Repository<Invitation>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(
    createInvitationDto: CreateInvitationDto,
    userId: string,
    organizationId: string,
  ): Promise<Invitation> {
    // Check if user with this email already exists in the organization
    const existingUser = await this.usersRepository.findOne({
      where: { email: createInvitationDto.email, organizationId },
    });

    if (existingUser) {
      throw new ConflictException(
        "User with this email already exists in your organization",
      );
    }

    // Check if there's already a pending invitation
    const existingInvitation = await this.invitationsRepository.findOne({
      where: {
        email: createInvitationDto.email,
        organizationId,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new ConflictException(
        "An invitation for this email is already pending",
      );
    }

    const invitation = this.invitationsRepository.create({
      email: createInvitationDto.email,
      role: createInvitationDto.role,
      organizationId,
      invitedById: userId,
    });

    return await this.invitationsRepository.save(invitation);
  }

  async findAll(organizationId: string): Promise<Invitation[]> {
    return await this.invitationsRepository.find({
      where: { organizationId },
      relations: ["invitedBy"],
      order: { createdAt: "DESC" },
    });
  }

  async findByToken(token: string): Promise<Invitation> {
    const invitation = await this.invitationsRepository.findOne({
      where: { token },
      relations: ["organization"],
    });

    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        "This invitation has already been used or revoked",
      );
    }

    if (invitation.expiresAt < new Date()) {
      // Update status to expired
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationsRepository.save(invitation);
      throw new BadRequestException("This invitation has expired");
    }

    return invitation;
  }

  async accept(acceptInvitationDto: AcceptInvitationDto): Promise<User> {
    const invitation = await this.findByToken(acceptInvitationDto.token);

    // Check if user with this username already exists
    const existingUser = await this.usersRepository.findOne({
      where: { username: acceptInvitationDto.username },
    });

    if (existingUser) {
      throw new ConflictException("Username already taken");
    }

    // Check if user with this email already exists
    const existingEmailUser = await this.usersRepository.findOne({
      where: { email: invitation.email },
    });

    if (existingEmailUser) {
      throw new ConflictException("A user with this email already exists");
    }

    // Hash password
    const hashedPassword = await argon2.hash(acceptInvitationDto.password);

    // Create new user
    const user = this.usersRepository.create({
      username: acceptInvitationDto.username,
      email: invitation.email,
      password: hashedPassword,
      fullName: acceptInvitationDto.fullName,
      organizationId: invitation.organizationId,
    });

    const savedUser = await this.usersRepository.save(user);

    // Update invitation status
    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedByUserId = savedUser.id;
    invitation.acceptedAt = new Date();
    await this.invitationsRepository.save(invitation);

    // Create user role based on invitation
    // This would need to be implemented with your UserRole entity
    // For now, we'll skip this part as it requires the UserRole service

    return savedUser;
  }

  async revoke(id: string, organizationId: string): Promise<void> {
    const invitation = await this.invitationsRepository.findOne({
      where: { id, organizationId },
    });

    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException("Only pending invitations can be revoked");
    }

    invitation.status = InvitationStatus.REVOKED;
    await this.invitationsRepository.save(invitation);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const invitation = await this.invitationsRepository.findOne({
      where: { id, organizationId },
    });

    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }

    await this.invitationsRepository.remove(invitation);
  }

  // Cleanup expired invitations (can be run as a cron job)
  async cleanupExpired(): Promise<number> {
    const expiredInvitations = await this.invitationsRepository.find({
      where: { status: InvitationStatus.PENDING },
    });

    const now = new Date();
    const toUpdate = expiredInvitations.filter((inv) => inv.expiresAt < now);

    for (const invitation of toUpdate) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationsRepository.save(invitation);
    }

    return toUpdate.length;
  }
}
