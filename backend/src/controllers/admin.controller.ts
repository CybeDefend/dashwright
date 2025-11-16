import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Req,
  Param,
  Delete,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { SuperAdmin } from "../decorators/super-admin.decorator";
import { SuperAdminGuard } from "../guards/super-admin.guard";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import { User } from "../entities/user.entity";
import { Organization } from "../entities/organization.entity";
import { TestRun, TestRunStatus } from "../entities/test-run.entity";
import { SystemSettingsService } from "../services/system-settings.service";
import { StorageService } from "../artifacts/storage.service";
import * as packageJson from "../../package.json";
import { Request } from "express";

@Controller("admin")
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@SuperAdmin()
export class AdminController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(TestRun)
    private testRunRepository: Repository<TestRun>,
    private systemSettingsService: SystemSettingsService,
    private storageService: StorageService,
  ) {}

  @Get("dashboard")
  async getDashboard() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all data in parallel
    const [
      totalUsers,
      activeUsers,
      usersLastWeek,
      totalOrganizations,
      orgsLastWeek,
      totalTestRuns,
      testRunsToday,
      testRunsThisWeek,
      passedRuns,
      failedRuns,
      runningRuns,
      recentUsers,
      recentTestRuns,
      registrationEnabled,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository.count({ where: { createdAt: MoreThan(weekAgo) } }),
      this.organizationRepository.count(),
      this.organizationRepository.count({
        where: { createdAt: MoreThan(weekAgo) },
      }),
      this.testRunRepository.count(),
      this.testRunRepository.count({ where: { createdAt: MoreThan(today) } }),
      this.testRunRepository.count({ where: { createdAt: MoreThan(weekAgo) } }),
      this.testRunRepository.count({ where: { status: TestRunStatus.PASSED } }),
      this.testRunRepository.count({ where: { status: TestRunStatus.FAILED } }),
      this.testRunRepository.count({
        where: { status: TestRunStatus.RUNNING },
      }),
      this.userRepository.find({
        relations: ["organization"],
        order: { createdAt: "DESC" },
        take: 5,
      }),
      this.testRunRepository.find({
        relations: ["organization", "createdBy"],
        order: { createdAt: "DESC" },
        take: 5,
      }),
      this.systemSettingsService.isRegistrationEnabled(),
    ]);

    // Calculate derived values
    const inactiveUsers = totalUsers - activeUsers;
    const usersTrend = usersLastWeek > 0 ? "up" : "stable";
    const orgsTrend = orgsLastWeek > 0 ? "up" : "stable";

    // System info
    const startTime = process.uptime();
    const systemVersion = packageJson.version;
    const environment = process.env.NODE_ENV || "development";

    // Get real storage stats from Minio
    const bucketStats = await this.storageService.getBucketStats();
    const storageUsed = bucketStats.used; // in bytes
    const storageTotal = 10 * 1024 * 1024 * 1024; // 10GB default limit
    const storagePercentage = storageTotal > 0 ? (storageUsed / storageTotal) * 100 : 0;

    return {
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          trend: usersTrend,
          lastWeek: usersLastWeek,
        },
        organizations: {
          total: totalOrganizations,
          trend: orgsTrend,
          lastWeek: orgsLastWeek,
        },
        testRuns: {
          total: totalTestRuns,
          today: testRunsToday,
          week: testRunsThisWeek,
          passed: passedRuns,
          failed: failedRuns,
          running: runningRuns,
        },
        storage: {
          used: storageUsed,
          total: storageTotal,
          percentage: Math.round(storagePercentage),
        },
        system: {
          version: systemVersion,
          environment,
          uptime: Math.floor(startTime),
        },
      },
      recentUsers: recentUsers.map((user) => ({
        id: user.id,
        name: user.fullName || user.username,
        email: user.email,
        organization: user.organization?.name || "No organization",
        avatar: user.email
          ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName || user.username)}`
          : null,
        isActive: user.isActive,
        createdAt: user.createdAt,
      })),
      recentTestRuns: recentTestRuns.map((run) => ({
        id: run.id,
        name: run.name,
        organizationName: run.organization?.name || "Unknown",
        status: run.status,
        createdAt: run.createdAt,
        duration: 0, // TODO: calculate duration
      })),
      settings: {
        registrationEnabled,
      },
    };
  }

  @Get("stats")
  async getStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Users stats
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({
      where: { isActive: true },
    });
    const inactiveUsers = totalUsers - activeUsers;
    const usersLastWeek = await this.userRepository.count({
      where: { createdAt: MoreThan(weekAgo) },
    });
    const usersTrend = usersLastWeek > 0 ? "up" : "stable";

    // Organizations stats
    const totalOrganizations = await this.organizationRepository.count();
    const orgsLastWeek = await this.organizationRepository.count({
      where: { createdAt: MoreThan(weekAgo) },
    });
    const orgsTrend = orgsLastWeek > 0 ? "up" : "stable";

    // Test runs stats
    const totalTestRuns = await this.testRunRepository.count();
    const testRunsToday = await this.testRunRepository.count({
      where: { createdAt: MoreThan(today) },
    });
    const testRunsThisWeek = await this.testRunRepository.count({
      where: { createdAt: MoreThan(weekAgo) },
    });

    // Test runs by status
    const passedRuns = await this.testRunRepository.count({
      where: { status: TestRunStatus.PASSED },
    });
    const failedRuns = await this.testRunRepository.count({
      where: { status: TestRunStatus.FAILED },
    });
    const runningRuns = await this.testRunRepository.count({
      where: { status: TestRunStatus.RUNNING },
    });

    // Get real storage stats from Minio
    const bucketStats = await this.storageService.getBucketStats();
    const storageUsed = bucketStats.used; // in bytes
    const storageTotal = 10 * 1024 * 1024 * 1024; // 10GB default limit
    const storagePercentage = storageTotal > 0 ? (storageUsed / storageTotal) * 100 : 0;

    // System info
    const startTime = process.uptime();
    const systemVersion = packageJson.version;
    const environment = process.env.NODE_ENV || "development";

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        trend: usersTrend,
        lastWeek: usersLastWeek,
      },
      organizations: {
        total: totalOrganizations,
        trend: orgsTrend,
        lastWeek: orgsLastWeek,
      },
      testRuns: {
        total: totalTestRuns,
        today: testRunsToday,
        week: testRunsThisWeek,
        passed: passedRuns,
        failed: failedRuns,
        running: runningRuns,
      },
      storage: {
        used: storageUsed,
        total: storageTotal,
        percentage: Math.round(storagePercentage),
      },
      system: {
        version: systemVersion,
        environment,
        uptime: Math.floor(startTime),
      },
    };
  }

  @Get("organization")
  async getOrganization(@Req() req: Request) {
    const user = req.user as any;
    if (!user?.organizationId) {
      return null;
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: user.organizationId },
    });

    if (!organization) {
      return null;
    }

    return {
      id: organization.id,
      name: organization.name,
    };
  }

  @Get("users/recent")
  async getRecentUsers(@Query("limit") limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 5;

    const users = await this.userRepository.find({
      relations: ["organization"],
      order: { createdAt: "DESC" },
      take: limitNum,
    });

    return users.map((user) => ({
      id: user.id,
      name: user.fullName || user.username,
      email: user.email,
      organization: user.organization?.name || "No organization",
      avatar: user.email
        ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName || user.username)}`
        : null,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }));
  }

  @Get("test-runs/recent")
  async getRecentTestRuns(@Query("limit") limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 5;

    const testRuns = await this.testRunRepository.find({
      relations: ["organization", "createdBy"],
      order: { createdAt: "DESC" },
      take: limitNum,
    });

    return testRuns.map((run) => ({
      id: run.id,
      name: run.name,
      organization: run.organization?.name || "Unknown",
      status: run.status,
      branch: run.branch,
      createdAt: run.createdAt,
      createdBy: run.createdBy?.username || "Unknown",
    }));
  }

  @Get("settings")
  async getSettings() {
    const settings = await this.systemSettingsService.getAllSettings();
    return settings.map((setting) => ({
      key: setting.key,
      value: setting.value,
      description: setting.description,
      updatedAt: setting.updatedAt,
    }));
  }

  @Post("settings")
  async updateSetting(@Body() body: { key: string; value: string }) {
    const setting = await this.systemSettingsService.setSetting(
      body.key,
      body.value,
    );
    return {
      key: setting.key,
      value: setting.value,
      description: setting.description,
      updatedAt: setting.updatedAt,
    };
  }

  @Get("settings/registration-enabled")
  async isRegistrationEnabled() {
    const enabled = await this.systemSettingsService.isRegistrationEnabled();
    return { enabled };
  }

  @Post("settings/registration-enabled")
  async setRegistrationEnabled(@Body() body: { enabled: boolean }) {
    await this.systemSettingsService.setRegistrationEnabled(body.enabled);
    return { enabled: body.enabled };
  }

  @Get("users")
  async getAllUsers(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await this.userRepository.findAndCount({
      relations: ["organization"],
      order: { createdAt: "DESC" },
      take: limitNum,
      skip,
    });

    return {
      users: users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        isActive: user.isActive,
        isSuperAdmin: user.isSuperAdmin,
        organization: user.organization?.name || "No organization",
        organizationId: user.organizationId,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      })),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  @Post("users/:id/toggle-active")
  async toggleUserActive(@Param("id") id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error("User not found");
    }

    user.isActive = !user.isActive;
    await this.userRepository.save(user);

    return {
      id: user.id,
      isActive: user.isActive,
    };
  }

  @Delete("users/:id")
  async deleteUser(@Param("id") id: string, @Req() req: Request) {
    const currentUser = req.user as any;

    // Prevent deleting yourself
    if (currentUser.id === id) {
      throw new Error("Cannot delete your own account");
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error("User not found");
    }

    // Prevent deleting super admin
    if (user.isSuperAdmin) {
      throw new Error("Cannot delete super admin");
    }

    await this.userRepository.remove(user);
    return { success: true };
  }

  @Get("organizations")
  async getAllOrganizations(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const skip = (pageNum - 1) * limitNum;

    const [organizations, total] =
      await this.organizationRepository.findAndCount({
        relations: ["users", "testRuns"],
        order: { createdAt: "DESC" },
        take: limitNum,
        skip,
      });

    return {
      organizations: organizations.map((org) => ({
        id: org.id,
        name: org.name,
        description: org.description,
        isActive: org.isActive,
        usersCount: org.users?.length || 0,
        testRunsCount: org.testRuns?.length || 0,
        createdAt: org.createdAt,
      })),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  @Delete("organizations/:id")
  async deleteOrganization(@Param("id") id: string) {
    const organization = await this.organizationRepository.findOne({
      where: { id },
      relations: ["users"],
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Check if organization has users
    if (organization.users && organization.users.length > 0) {
      throw new Error(
        "Cannot delete organization with existing users. Please remove or transfer users first."
      );
    }

    await this.organizationRepository.remove(organization);
    return { success: true };
  }
}
