import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicBaseUrl?: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT') || 'bb-minio';
    const port = this.configService.get<number>('MINIO_PORT') || 9000;
    const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY') || 'minio-root';
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY') || 'minio-root-secret';
    const region = this.configService.get<string>('MINIO_REGION') || 'us-east-1';

    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME') || 'bb-learning';
    this.publicBaseUrl = this.configService.get<string>('MINIO_PUBLIC_BASE_URL');

    const endpointUrl = useSSL ? `https://${endpoint}:${port}` : `http://${endpoint}:${port}`;

    // Create S3Client for MinIO (S3-compatible)
    this.s3Client = new S3Client({
      endpoint: endpointUrl,
      region: region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async onModuleInit() {
    // Attempt to create bucket if it doesn't exist (idempotent)
    try {
      await this.ensureBucketExists();
      this.logger.log(`MinIO bucket '${this.bucketName}' is ready`);
    } catch (error) {
      this.logger.warn(
        `Failed to ensure bucket exists: ${error}. Please create bucket '${this.bucketName}' manually in MinIO console.`,
      );
    }
  }

  /**
   * Ensure bucket exists, create if it doesn't
   */
  private async ensureBucketExists() {
    try {
      // Check if bucket exists
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
      this.logger.log(`Bucket '${this.bucketName}' already exists`);
    } catch (error: any) {
      // If bucket doesn't exist (404), create it
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        this.logger.log(`Creating bucket '${this.bucketName}'...`);
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucketName }),
        );
        this.logger.log(`Bucket '${this.bucketName}' created successfully`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Upload buffer to MinIO
   * @param key Object key (path in bucket)
   * @param buffer File buffer
   * @param contentType MIME type
   */
  async uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<void> {
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );
      this.logger.log(`File uploaded: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to upload file ${key}:`, error);
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  /**
   * Get object stream from MinIO
   * @param key Object key
   * @returns Stream and content type
   */
  async getObjectStream(key: string): Promise<{ stream: Readable; contentType: string }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('Object body is empty');
      }

      const stream = response.Body as Readable;
      const contentType = response.ContentType || 'application/octet-stream';

      return { stream, contentType };
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        throw new Error(`Object not found: ${key}`);
      }
      this.logger.error(`Failed to get object ${key}:`, error);
      throw new Error(`Failed to get object: ${error}`);
    }
  }

  /**
   * Remove object from MinIO
   * @param key Object key
   */
  async removeObject(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      this.logger.log(`Object deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete object ${key}:`, error);
      throw new Error(`Failed to delete object: ${error}`);
    }
  }

  /**
   * Generate public URL for object
   * If MINIO_PUBLIC_BASE_URL is set, use it; otherwise return our streaming endpoint
   * Note: For streaming endpoint, we need audioAssetId, not key
   */
  getPublicUrl(key: string, audioAssetId?: string): string {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${key}`;
    }
    // Fallback: use our streaming endpoint (requires audioAssetId)
    // Use app base URL from env or default to service name
    const appBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL') || 'http://dou-service:3001';
    if (audioAssetId) {
      return `${appBaseUrl}/api/learning/assets/audio/${audioAssetId}/file`;
    }
    // If no audioAssetId provided, return key-based URL (will need lookup)
    return `${appBaseUrl}/api/learning/assets/audio/${key}/file`;
  }
}

