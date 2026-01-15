import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderItemDto {
  @ApiProperty({ description: 'Unit ID (Prisma PK)', example: 'clx123...', required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Unit business key (unitId)', example: 'unit-1', required: false })
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiProperty({ description: 'New order value', example: 1 })
  @IsInt()
  @Min(0)
  order: number;
}

export class BulkReorderUnitsDto {
  @ApiProperty({ description: 'List of units to reorder', type: [ReorderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}

export class ReorderLessonItemDto {
  @ApiProperty({ description: 'Lesson ID (Prisma PK)', example: 'clx123...', required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Lesson business key (lessonId)', example: 'lesson-1-1', required: false })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiProperty({ description: 'New order value', example: 1 })
  @IsInt()
  @Min(0)
  order: number;
}

export class BulkReorderLessonsDto {
  @ApiProperty({ description: 'List of lessons to reorder', type: [ReorderLessonItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderLessonItemDto)
  items: ReorderLessonItemDto[];
}

export class ReorderQuestionItemDto {
  @ApiProperty({ description: 'Question ID (Prisma PK)', example: 'clx123...', required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Question business key (questionId)', example: 'q-listening-01', required: false })
  @IsOptional()
  @IsString()
  questionId?: string;

  @ApiProperty({ description: 'New order value', example: 1 })
  @IsInt()
  @Min(0)
  order: number;
}

export class BulkReorderQuestionsDto {
  @ApiProperty({ description: 'List of questions to reorder', type: [ReorderQuestionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderQuestionItemDto)
  items: ReorderQuestionItemDto[];
}

