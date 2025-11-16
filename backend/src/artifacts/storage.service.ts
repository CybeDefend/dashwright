import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Minio from "minio";
import { FileUtil } from "../common/utils/file.util";

@Injectable()
export class StorageService {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get("STORAGE_ENDPOINT", "minio"),
      port: this.configService.get("STORAGE_PORT", 9000),
      useSSL: this.configService.get("STORAGE_USE_SSL", "false") === "true",
      accessKey: this.configService.get("STORAGE_ACCESS_KEY", "minioadmin"),
      secretKey: this.configService.get("STORAGE_SECRET_KEY", "minioadmin"),
    });

    this.bucketName = this.configService.get(
      "STORAGE_BUCKET",
      "dashwright-artifacts",
    );
    this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, "us-east-1");
      }
    } catch (error) {
      console.error("Error ensuring bucket exists:", error);
    }
  }

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    const sanitizedKey = FileUtil.sanitizeFilename(key);

    await this.minioClient.putObject(
      this.bucketName,
      sanitizedKey,
      file.buffer,
      file.size,
      {
        "Content-Type": file.mimetype,
      },
    );

    return sanitizedKey;
  }

  async getFileUrl(key: string, expirySeconds: number = 3600): Promise<string> {
    return this.minioClient.presignedGetObject(
      this.bucketName,
      key,
      expirySeconds,
    );
  }

  async deleteFile(key: string): Promise<void> {
    await this.minioClient.removeObject(this.bucketName, key);
  }
}
