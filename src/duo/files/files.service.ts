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

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const uniqueId = randomBytes(16).toString('hex');
    const filename = `${uniqueId}${ext}`;
    const localPath = path.join(this.uploadDir, filename);
    const url = `${this.publicBaseUrl}/api/files/audio/${filename}`;

    // Save file to disk
    fs.writeFileSync(localPath, file.buffer);

    // Save metadata to database
    const audioAsset = await this.prisma.audioAsset.create({
      data: {
        filename: file.originalname,
        localPath,
        url,
        contentType: file.mimetype,
        size: file.size,
      },
    });

    return {
      id: audioAsset.id,
      filename: audioAsset.filename,
      contentType: audioAsset.contentType,
      size: audioAsset.size,
      url: audioAsset.url,
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
          filename: {
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
          filename: true,
          url: true,
          size: true,
          createdAt: true,
        },
      }),
      this.prisma.audioAsset.count({ where }),
    ]);

    return {
      items,
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

    return {
      id: audioAsset.id,
      filename: audioAsset.filename,
      url: audioAsset.url,
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
        ...(filename && { filename }),
      },
    });

    return {
      id: updated.id,
      filename: updated.filename,
      url: updated.url,
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

    // Delete file from disk if local storage
    if (audioAsset.localPath) {
      try {
        if (fs.existsSync(audioAsset.localPath)) {
          fs.unlinkSync(audioAsset.localPath);
        }
      } catch (error) {
        // Log error but continue with DB deletion
        console.error('Failed to delete file from disk:', error);
      }
    }

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

    if (audioAsset.localPath && fs.existsSync(audioAsset.localPath)) {
      const buffer = fs.readFileSync(audioAsset.localPath);
      return {
        buffer,
        contentType: audioAsset.contentType,
        filename: audioAsset.filename,
      };
    }

    throw new NotFoundException('Audio file not found on disk');
  }
}

