import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { AudioAssetsService } from './audio-assets.service';
import { successResponse } from '../../../common/utils/response.util';

@ApiTags('Learning Assets')
@Controller('learning/assets/audio')
export class AudioAssetsController {
  constructor(private readonly audioAssetsService: AudioAssetsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('audio/')) {
          return cb(new BadRequestException('File must be an audio file'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Upload audio file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Audio file uploaded successfully',
    schema: {
      example: {
        id: 'cuid',
        url: 'http://localhost:3001/api/learning/assets/audio/cuid/file',
        originalName: 'lesson-1-audio.mp3',
        contentType: 'audio/mpeg',
        size: 1024000,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    const result = await this.audioAssetsService.uploadAudio(file);
    return successResponse(result);
  }

  @Get()
  @ApiOperation({ summary: 'List audio files with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Audio files list',
    schema: {
      example: {
        items: [
          {
            id: 'cuid',
            originalName: 'lesson-1-audio.mp3',
            contentType: 'audio/mpeg',
            size: 1024000,
            url: 'http://localhost:3001/api/learning/assets/audio/cuid/file',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        total: 10,
        page: 1,
        limit: 20,
      },
    },
  })
  async listAudio(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const result = await this.audioAssetsService.listAudio(pageNum, limitNum, search);
    return successResponse(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audio file metadata' })
  @ApiParam({ name: 'id', type: String, description: 'Audio asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Audio file metadata',
  })
  async getAudio(@Param('id') id: string) {
    const result = await this.audioAssetsService.getAudioById(id);
    return successResponse(result);
  }

  @Get(':id/file')
  @ApiOperation({ summary: 'Stream audio file' })
  @ApiParam({ name: 'id', type: String, description: 'Audio asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Audio file stream',
  })
  async getAudioFile(@Param('id') id: string, @Res() res: Response) {
    const { stream, contentType, filename } = await this.audioAssetsService.getAudioStream(id);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Accept-Ranges', 'bytes');
    
    stream.pipe(res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete audio file' })
  @ApiParam({ name: 'id', type: String, description: 'Audio asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Audio file deleted',
    schema: {
      example: {
        ok: true,
      },
    },
  })
  async deleteAudio(@Param('id') id: string) {
    const result = await this.audioAssetsService.deleteAudio(id);
    return successResponse(result);
  }
}

