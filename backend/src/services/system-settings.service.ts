import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SystemSetting } from "../entities/system-setting.entity";

@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectRepository(SystemSetting)
    private systemSettingRepository: Repository<SystemSetting>,
  ) {}

  async getSetting(key: string): Promise<string | null> {
    const setting = await this.systemSettingRepository.findOne({
      where: { key },
    });
    return setting ? setting.value : null;
  }

  async getSettingAsBoolean(
    key: string,
    defaultValue = false,
  ): Promise<boolean> {
    const value = await this.getSetting(key);
    if (value === null) return defaultValue;
    return value === "true";
  }

  async setSetting(key: string, value: string): Promise<SystemSetting> {
    let setting = await this.systemSettingRepository.findOne({
      where: { key },
    });

    if (setting) {
      setting.value = value;
    } else {
      setting = this.systemSettingRepository.create({ key, value });
    }

    return this.systemSettingRepository.save(setting);
  }

  async getAllSettings(): Promise<SystemSetting[]> {
    return this.systemSettingRepository.find({
      order: { key: "ASC" },
    });
  }

  async isRegistrationEnabled(): Promise<boolean> {
    return this.getSettingAsBoolean("registration_enabled", true);
  }

  async setRegistrationEnabled(enabled: boolean): Promise<void> {
    await this.setSetting("registration_enabled", enabled.toString());
  }
}
