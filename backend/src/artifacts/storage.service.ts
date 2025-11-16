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

  async getBucketStats(): Promise<{
    used: number;
    total: number;
    objectCount: number;
  }> {
    try {
      let totalSize = 0;
      let objectCount = 0;

      const objectsStream = this.minioClient.listObjectsV2(
        this.bucketName,
        "",
        true,
      );

      await new Promise<void>((resolve, reject) => {
        objectsStream.on("data", (obj) => {
          if (obj.size) {
            totalSize += obj.size;
            objectCount++;
          }
        });
        objectsStream.on("error", reject);
        objectsStream.on("end", () => resolve());
      });

      // Get storage capacity from config or use default
      const storageLimit = this.configService.get<number>(
        "STORAGE_LIMIT_GB",
        100,
      );
      const totalCapacity = storageLimit * 1024 * 1024 * 1024; // Convert GB to bytes

      return {
        used: totalSize,
        total: totalCapacity,
        objectCount,
      };
    } catch (error) {
      console.error("Error getting bucket stats:", error);
      const storageLimit = this.configService.get<number>(
        "STORAGE_LIMIT_GB",
        100,
      );
      return {
        used: 0,
        total: storageLimit * 1024 * 1024 * 1024,
        objectCount: 0,
      };
    }
  }
}
