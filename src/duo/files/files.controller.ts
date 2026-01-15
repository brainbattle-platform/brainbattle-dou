import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { FilesService } from './files.service';
import { CreateAudioDto } from './dto/create-audio.dto';
import { UpdateAudioDto } from './dto/update-audio.dto';
import { ListAudioQueryDto } from './dto/list-audio-query.dto';
import { successResponse } from '../../common/utils/response.util';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('audio')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(mp3|wav|m4a|mp4)$/)) {
          return cb(new BadRequestException('File must be an audio file (mp3, wav, m4a)'), false);
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
        id: 'uuid',
        filename: 'lesson-1-audio.mp3',
        contentType: 'audio/mpeg',
        size: 1024000,
        url: 'http://localhost:3000/api/files/audio/uuid.mp3',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    const result = await this.filesService.uploadAudio(file);
    return successResponse(result);
  }

  @Get('audio')
  @ApiOperation({ summary: 'List audio files with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Audio files list',
    schema: {
      example: {
        items: [
          {
            id: 'uuid',
            filename: 'lesson-1-audio.mp3',
            url: 'http://localhost:3000/api/files/audio/uuid.mp3',
            size: 1024000,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        total: 10,
        page: 1,
        limit: 20,
      },
    },
  })
  async listAudio(@Query() query: ListAudioQueryDto) {
    const result = await this.filesService.listAudio(query.page, query.limit, query.search);
    return successResponse(result);
  }

  @Get('audio/:id')
  @ApiOperation({ summary: 'Get audio file metadata or stream file' })
  @ApiParam({ name: 'id', type: String, description: 'Audio asset ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Audio file metadata',
  })
  async getAudio(@Param('id') id: string, @Res() res?: Response) {
    try {
      // Try to stream file if requested
      const fileData = await this.filesService.getFileBuffer(id);
      if (res) {
        res.setHeader('Content-Type', fileData.contentType);
        res.setHeader('Content-Disposition', `inline; filename="${fileData.filename}"`);
        return res.send(fileData.buffer);
      }
    } catch (error) {
      // If streaming fails, return metadata only
    }

    // Return metadata only
    const metadata = await this.filesService.getAudioById(id);
    return successResponse(metadata);
  }

  @Patch('audio/:id')
  @ApiOperation({ summary: 'Update audio file metadata' })
  @ApiParam({ name: 'id', type: String, description: 'Audio asset ID (UUID)' })
  @ApiBody({ type: UpdateAudioDto })
  @ApiResponse({
    status: 200,
    description: 'Audio file metadata updated',
  })
  async updateAudio(@Param('id') id: string, @Body() dto: UpdateAudioDto) {
    const result = await this.filesService.updateAudio(id, dto.filename);
    return successResponse(result);
  }

  @Delete('audio/:id')
  @ApiOperation({ summary: 'Delete audio file' })
  @ApiParam({ name: 'id', type: String, description: 'Audio asset ID (UUID)' })
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
    const result = await this.filesService.deleteAudio(id);
    return successResponse(result);
  }
}

