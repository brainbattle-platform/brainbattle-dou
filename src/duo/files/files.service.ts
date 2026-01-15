import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

@Injectable()
export class FilesService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'audio');
  private readonly publicBaseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

  constructor(private readonly prisma: PrismaService) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Upload audio file
   */
  async uploadAudio(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file type
    const allowedMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-m4a', 'audio/mp4'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('File must be an audio file (mp3, wav, m4a)');
    }

    // Validate file size (15MB max)
    const maxSize = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must not exceed 15MB');
    }

    // Note: This service is legacy and uses local storage
    // New audio uploads should use AudioAssetsService which uses MinIO
    // Keeping this for backward compatibility but files should be migrated to MinIO

    // Generate MinIO key (since we're using MinIO, not local storage)
    const ext = path.extname(file.originalname);
    const uniqueId = randomBytes(16).toString('hex');
    const key = `audio/${uniqueId}${ext}`;
    const bucket = 'bb-learning';

    // Save metadata to database (using schema fields: originalName, key, bucket)
    const audioAsset = await this.prisma.audioAsset.create({
      data: {
        key,
        bucket,
        originalName: file.originalname,
        contentType: file.mimetype,
        size: file.size,
      },
    });

    // Compute URL from public base URL + key
    const computedUrl = `${this.publicBaseUrl}/api/files/audio/${audioAsset.id}`;

    return {
      id: audioAsset.id,
      filename: audioAsset.originalName, // Use originalName for backward compatibility
      contentType: audioAsset.contentType,
      size: audioAsset.size,
      url: computedUrl,
      createdAt: audioAsset.createdAt,
    };
  }

  /**
   * List audio files with pagination
   */
  async listAudio(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          originalName: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.audioAsset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          originalName: true,
          key: true,
          bucket: true,
          size: true,
          createdAt: true,
        },
      }),
      this.prisma.audioAsset.count({ where }),
    ]);

    // Compute URLs for items
    const itemsWithUrl = items.map((item) => ({
      id: item.id,
      filename: item.originalName, // Use originalName as filename for backward compatibility
      url: `${this.publicBaseUrl}/api/files/audio/${item.id}`,
      size: item.size,
      createdAt: item.createdAt,
    }));

    return {
      items: itemsWithUrl,
      total,
      page,
      limit,
    };
  }

  /**
   * Get audio file by ID
   */
  async getAudioById(id: string) {
    const audioAsset = await this.prisma.audioAsset.findUnique({
      where: { id },
    });

    if (!audioAsset) {
      throw new NotFoundException('Audio file not found');
    }

    // Compute URL from public base URL
    const computedUrl = `${this.publicBaseUrl}/api/files/audio/${audioAsset.id}`;

    return {
      id: audioAsset.id,
      filename: audioAsset.originalName, // Use originalName as filename
      url: computedUrl,
      contentType: audioAsset.contentType,
      size: audioAsset.size,
      createdAt: audioAsset.createdAt,
      updatedAt: audioAsset.updatedAt,
    };
  }

  /**
   * Update audio file metadata
   */
  async updateAudio(id: string, filename?: string) {
    const audioAsset = await this.prisma.audioAsset.findUnique({
      where: { id },
    });

    if (!audioAsset) {
      throw new NotFoundException('Audio file not found');
    }

    const updated = await this.prisma.audioAsset.update({
      where: { id },
      data: {
        ...(filename && { originalName: filename }), // Use originalName field
      },
    });

    // Compute URL from public base URL
    const computedUrl = `${this.publicBaseUrl}/api/files/audio/${updated.id}`;

    return {
      id: updated.id,
      filename: updated.originalName, // Use originalName as filename
      url: computedUrl,
      contentType: updated.contentType,
      size: updated.size,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Delete audio file
   */
  async deleteAudio(id: string) {
    const audioAsset = await this.prisma.audioAsset.findUnique({
      where: { id },
    });

    if (!audioAsset) {
      throw new NotFoundException('Audio file not found');
    }

    // Note: Files are stored in MinIO, not local disk
    // If you need to delete from MinIO, use StorageService here
    // For now, we only delete from database

    // Delete from database
    await this.prisma.audioAsset.delete({
      where: { id },
    });

    return { ok: true };
  }

  /**
   * Get file buffer for streaming (for GET /api/files/audio/:id)
   */
  async getFileBuffer(id: string): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const audioAsset = await this.prisma.audioAsset.findUnique({
      where: { id },
    });

    if (!audioAsset) {
      throw new NotFoundException('Audio file not found');
    }

    // Note: Files are stored in MinIO, not local disk
    // This method should be refactored to use StorageService to get file from MinIO
    // For now, throw error indicating file needs to be retrieved from MinIO
    throw new NotFoundException(
      'Audio file is stored in MinIO. Use StorageService to retrieve it.',
    );
  }
}

