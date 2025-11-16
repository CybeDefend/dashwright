import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { ArtifactsService } from "./artifacts.service";
import { StorageService } from "./storage.service";
import { CreateArtifactDto } from "../common/dto/artifact.dto";
import { JwtOrApiKeyGuard } from "../common/guards/jwt-or-api-key.guard";
import { FileUtil } from "../common/utils/file.util";

@ApiTags("Artifacts")
@ApiBearerAuth("JWT-auth")
@ApiSecurity("API-Key")
@Controller("artifacts")
@UseGuards(JwtOrApiKeyGuard)
export class ArtifactsController {
  constructor(
    private artifactsService: ArtifactsService,
    private storageService: StorageService,
  ) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() createArtifactDto: CreateArtifactDto,
    @Req() req: any,
  ) {
    // Sanitize filename from client to prevent path traversal
    const sanitizedFilename = FileUtil.sanitizeFilename(
      createArtifactDto.filename,
    );
    const uniqueKey = FileUtil.generateUniqueFilename(sanitizedFilename);
    const storageKey = await this.storageService.uploadFile(file, uniqueKey);

    const artifact = await this.artifactsService.create({
      ...createArtifactDto,
      filename: sanitizedFilename, // Use sanitized filename
      storageKey,
      // mimeType from DTO, size from actual uploaded file
      size: file.size,
    });

    return artifact;
  }

  @Get("test-run/:testRunId")
  findByTestRun(@Param("testRunId") testRunId: string) {
    return this.artifactsService.findByTestRun(testRunId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.artifactsService.findOne(id);
  }

  @Get(":id/download-url")
  async getDownloadUrl(
    @Param("id") id: string,
    @Query("expiry") expiry?: number,
  ) {
    const artifact = await this.artifactsService.findOne(id);
    if (!artifact) {
      throw new Error("Artifact not found");
    }
    const url = await this.storageService.getFileUrl(
      artifact.storageKey,
      expiry,
    );
    return { url };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const artifact = await this.artifactsService.findOne(id);
    if (!artifact) {
      throw new Error("Artifact not found");
    }
    await this.storageService.deleteFile(artifact.storageKey);
    await this.artifactsService.remove(id);
    return { success: true };
  }
}
