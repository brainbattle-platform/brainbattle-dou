import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../../storage/storage.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AudioAssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Upload audio file to MinIO and create AudioAsset record
   */
  async uploadAudio(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file type
    if (!file.mimetype.startsWith('audio/')) {
      throw new BadRequestException('File must be an audio file');
    }

    // Validate file size (15MB max)
    const maxSize = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must not exceed 15MB');
    }

    // Generate unique key
    const ext = file.originalname.split('.').pop() || 'mp3';
    const uniqueId = randomBytes(16).toString('hex');
    const key = `audio/${uniqueId}.${ext}`;

    // Upload to MinIO
    await this.storageService.uploadBuffer(key, file.buffer, file.mimetype);

    // Create database record
    const audioAsset = await this.prisma.audioAsset.create({
      data: {
        key,
        bucket: 'bb-learning',
        originalName: file.originalname,
        contentType: file.mimetype,
        size: file.size,
      },
    });

    // Generate public URL
    const url = this.storageService.getPublicUrl(key, audioAsset.id);

    return {
      id: audioAsset.id,
      url,
      originalName: audioAsset.originalName,
      contentType: audioAsset.contentType,
      size: audioAsset.size,
      createdAt: audioAsset.createdAt,
    };
  }

  /**
   * List audio assets with pagination
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
          contentType: true,
          size: true,
          createdAt: true,
        },
      }),
      this.prisma.audioAsset.count({ where }),
    ]);

    // Fetch keys for URL generation
    const itemsWithKeys = await Promise.all(
      items.map(async (item) => {
        const fullAsset = await this.prisma.audioAsset.findUnique({
          where: { id: item.id },
          select: { key: true },
        });
        return {
          ...item,
          url: fullAsset ? this.storageService.getPublicUrl(fullAsset.key, item.id) : '',
        };
      }),
    );

    return {
      items: itemsWithKeys,
      total,
      page,
      limit,
    };
  }

  /**
   * Get audio asset by ID
   */
  async getAudioById(id: string) {
    const audioAsset = await this.prisma.audioAsset.findUnique({
      where: { id },
    });

    if (!audioAsset) {
      throw new NotFoundException('Audio asset not found');
    }

    const url = this.storageService.getPublicUrl(audioAsset.key, audioAsset.id);

    return {
      id: audioAsset.id,
      url,
      originalName: audioAsset.originalName,
      contentType: audioAsset.contentType,
      size: audioAsset.size,
      durationSec: audioAsset.durationSec,
      createdAt: audioAsset.createdAt,
      updatedAt: audioAsset.updatedAt,
    };
  }

  /**
   * Get audio asset stream for file serving
   */
  async getAudioStream(id: string) {
    const audioAsset = await this.prisma.audioAsset.findUnique({
      where: { id },
    });

    if (!audioAsset) {
      throw new NotFoundException('Audio asset not found');
    }

    const { stream, contentType } = await this.storageService.getObjectStream(audioAsset.key);

    return {
      stream,
      contentType: contentType || audioAsset.contentType,
      filename: audioAsset.originalName,
    };
  }

  /**
   * Delete audio asset
   */
  async deleteAudio(id: string) {
    const audioAsset = await this.prisma.audioAsset.findUnique({
      where: { id },
    });

    if (!audioAsset) {
      throw new NotFoundException('Audio asset not found');
    }

    // Delete from MinIO
    try {
      await this.storageService.removeObject(audioAsset.key);
    } catch (error) {
      // Log but continue with DB deletion
      console.error('Failed to delete from MinIO:', error);
    }

    // Delete from database
    await this.prisma.audioAsset.delete({
      where: { id },
    });

    return { ok: true };
  }
}

