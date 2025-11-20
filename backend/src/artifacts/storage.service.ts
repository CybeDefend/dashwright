import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { FileUtil } from "../common/utils/file.util";

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get(
      "STORAGE_BUCKET",
      "dashwright-artifacts",
    );

    this.initializeS3();
    this.ensureBucketExists();
  }

  private initializeS3() {
    const endpoint = this.configService.get<string>("STORAGE_ENDPOINT");
    const accessKeyId = this.configService.get("STORAGE_ACCESS_KEY", "minioadmin");
    const secretAccessKey = this.configService.get("STORAGE_SECRET_KEY", "minioadmin");
    // AWS SDK requires a region, but it's ignored for custom endpoints
    const region = this.configService.get("STORAGE_REGION", "us-east-1");

    const config: any = {
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      forcePathStyle: true, // Required for MinIO and some S3-compatible providers
    };

    // Use custom endpoint for MinIO, Scaleway, or other S3-compatible providers
    if (endpoint) {
      config.endpoint = endpoint.startsWith("http")
        ? endpoint
        : `http://${endpoint}`;
      this.logger.log(`S3-compatible storage endpoint: ${config.endpoint}`);
    } else {
      this.logger.log(`AWS S3 region: ${region}`);
    }

    this.s3Client = new S3Client(config);
  }

  private async ensureBucketExists() {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
    } catch (error: any) {
      if (error.name === "NotFound") {
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucketName }),
        );
        this.logger.log(`Created bucket: ${this.bucketName}`);
      } else {
        this.logger.error("Error checking bucket:", error);
      }
    }
  }

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    const sanitizedKey = FileUtil.sanitizeFilename(key);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: sanitizedKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    await this.s3Client.send(command);

    return sanitizedKey;
  }

  async getFileUrl(key: string, expirySeconds: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, {
      expiresIn: expirySeconds,
    });
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    await this.s3Client.send(command);
  }

  async getBucketStats(): Promise<{
    used: number;
    total: number;
    objectCount: number;
  }> {
    try {
      let totalSize = 0;
      let objectCount = 0;

      let continuationToken: string | undefined;
      do {
        const command = new ListObjectsV2Command({
          Bucket: this.bucketName,
          ContinuationToken: continuationToken,
        });
        const response = await this.s3Client.send(command);

        if (response.Contents) {
          for (const obj of response.Contents) {
            if (obj.Size) {
              totalSize += obj.Size;
              objectCount++;
            }
          }
        }
        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      return {
        used: totalSize,
        total: 0, // No limit - unlimited storage
        objectCount,
      };
    } catch (error) {
      this.logger.error("Error getting bucket stats:", error);
      return {
        used: 0,
        total: 0, // No limit
        objectCount: 0,
      };
    }
  }
}
