import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import {
  BulkReorderUnitsDto,
  BulkReorderLessonsDto,
  BulkReorderQuestionsDto,
} from './dto/bulk-reorder.dto';

@Injectable()
export class AdminContentService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // Unit CRUD
  // ============================================

  async createUnit(dto: CreateUnitDto) {
    // Check if unitId already exists
    const existing = await this.prisma.unit.findUnique({
      where: { unitId: dto.unitId },
    });
    if (existing) {
      throw new BadRequestException(`Unit with unitId "${dto.unitId}" already exists`);
    }

    return this.prisma.unit.create({
      data: {
        unitId: dto.unitId,
        title: dto.title,
        order: dto.order ?? 0,
        published: dto.published ?? false,
      },
    });
  }

  async findAllUnits(publishedOnly: boolean = false) {
    const where = publishedOnly ? { published: true } : {};
    return this.prisma.unit.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findUnitById(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!unit) {
      throw new NotFoundException(`Unit with id "${id}" not found`);
    }
    return unit;
  }

  async findUnitByUnitId(unitId: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { unitId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!unit) {
      throw new NotFoundException(`Unit with unitId "${unitId}" not found`);
    }
    return unit;
  }

  async updateUnit(id: string, dto: UpdateUnitDto) {
    const unit = await this.findUnitById(id);
    
    // If order is being updated, check for duplicates and auto-shift if needed
    if (dto.order !== undefined && dto.order !== unit.order) {
      await this.ensureUniqueOrder('unit', id, dto.order);
    }
    
    return this.prisma.unit.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.published !== undefined && { published: dto.published }),
      },
    });
  }

  async updateUnitByUnitId(unitId: string, dto: UpdateUnitDto) {
    const unit = await this.findUnitByUnitId(unitId);
    return this.updateUnit(unit.id, dto);
  }

  async deleteUnit(id: string) {
    const unit = await this.findUnitById(id);
    
    // Check if unit has lessons
    const lessonCount = await this.prisma.lesson.count({
      where: { unitId: unit.unitId },
    });
    
    if (lessonCount > 0) {
      throw new BadRequestException(
        `Cannot delete unit "${unit.unitId}" because it has ${lessonCount} lesson(s). Delete lessons first or use cascade delete.`,
      );
    }

    return this.prisma.unit.delete({
      where: { id },
    });
  }

  async deleteUnitByUnitId(unitId: string) {
    const unit = await this.findUnitByUnitId(unitId);
    return this.deleteUnit(unit.id);
  }

  // ============================================
  // Lesson CRUD
  // ============================================

  async createLesson(dto: CreateLessonDto) {
    // Verify unit exists
    const unit = await this.prisma.unit.findUnique({
      where: { unitId: dto.unitId },
    });
    if (!unit) {
      throw new NotFoundException(`Unit with unitId "${dto.unitId}" not found`);
    }

    // Check if lessonId already exists
    const existing = await this.prisma.lesson.findUnique({
      where: { lessonId: dto.lessonId },
    });
    if (existing) {
      throw new BadRequestException(`Lesson with lessonId "${dto.lessonId}" already exists`);
    }

    return this.prisma.lesson.create({
      data: {
        lessonId: dto.lessonId,
        unitId: dto.unitId,
        title: dto.title,
        subtitle: dto.subtitle,
        order: dto.order ?? 0,
        estimatedMinutes: dto.estimatedMinutes ?? 3,
        published: dto.published ?? false,
      },
    });
  }

  async findAllLessons(unitId?: string, publishedOnly: boolean = false) {
    const where: any = {};
    if (unitId) {
      where.unitId = unitId;
    }
    if (publishedOnly) {
      where.published = true;
    }

    return this.prisma.lesson.findMany({
      where,
      orderBy: [{ unitId: 'asc' }, { order: 'asc' }],
      include: {
        unit: true,
        questions: {
          orderBy: [{ mode: 'asc' }, { order: 'asc' }],
        },
      },
    });
  }

  async findLessonById(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        unit: true,
        questions: {
          orderBy: [{ mode: 'asc' }, { order: 'asc' }],
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson with id "${id}" not found`);
    }
    return lesson;
  }

  async findLessonByLessonId(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { lessonId },
      include: {
        unit: true,
        questions: {
          orderBy: [{ mode: 'asc' }, { order: 'asc' }],
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson with lessonId "${lessonId}" not found`);
    }
    return lesson;
  }

  async updateLesson(id: string, dto: UpdateLessonDto) {
    const lesson = await this.findLessonById(id);

    // If unitId is being changed, verify new unit exists
    if (dto.unitId && dto.unitId !== lesson.unitId) {
      const unit = await this.prisma.unit.findUnique({
        where: { unitId: dto.unitId },
      });
      if (!unit) {
        throw new NotFoundException(`Unit with unitId "${dto.unitId}" not found`);
      }
    }

    // If order is being updated, check for duplicates and auto-shift if needed
    if (dto.order !== undefined && dto.order !== lesson.order) {
      await this.ensureUniqueOrder('lesson', id, dto.order, lesson.unitId);
    }

    return this.prisma.lesson.update({
      where: { id },
      data: {
        ...(dto.unitId !== undefined && { unitId: dto.unitId }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.estimatedMinutes !== undefined && { estimatedMinutes: dto.estimatedMinutes }),
        ...(dto.published !== undefined && { published: dto.published }),
      },
    });
  }

  async updateLessonByLessonId(lessonId: string, dto: UpdateLessonDto) {
    const lesson = await this.findLessonByLessonId(lessonId);
    return this.updateLesson(lesson.id, dto);
  }

  async deleteLesson(id: string) {
    const lesson = await this.findLessonById(id);

    // Check if lesson has questions
    const questionCount = await this.prisma.question.count({
      where: { lessonId: lesson.lessonId },
    });

    if (questionCount > 0) {
      throw new BadRequestException(
        `Cannot delete lesson "${lesson.lessonId}" because it has ${questionCount} question(s). Delete questions first or use cascade delete.`,
      );
    }

    return this.prisma.lesson.delete({
      where: { id },
    });
  }

  async deleteLessonByLessonId(lessonId: string) {
    const lesson = await this.findLessonByLessonId(lessonId);
    return this.deleteLesson(lesson.id);
  }

  // ============================================
  // Question CRUD
  // ============================================

  async createQuestion(dto: CreateQuestionDto) {
    // Verify lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { lessonId: dto.lessonId },
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson with lessonId "${dto.lessonId}" not found`);
    }

    // Check if questionId already exists
    const existing = await this.prisma.question.findUnique({
      where: { questionId: dto.questionId },
    });
    if (existing) {
      throw new BadRequestException(`Question with questionId "${dto.questionId}" already exists`);
    }

    // Create question with options
    const question = await this.prisma.question.create({
      data: {
        questionId: dto.questionId,
        lessonId: dto.lessonId,
        mode: dto.mode,
        type: dto.type ?? 'mcq',
        prompt: dto.prompt,
        correctAnswer: dto.correctAnswer,
        explanation: dto.explanation,
        hint: dto.hint,
        order: dto.order ?? 0,
        published: dto.published ?? false,
        options: dto.options
          ? {
              create: dto.options.map((opt, idx) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
                order: opt.order ?? idx,
              })),
            }
          : undefined,
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return question;
  }

  async findAllQuestions(lessonId?: string, mode?: string, publishedOnly: boolean = false) {
    const where: any = {};
    if (lessonId) {
      where.lessonId = lessonId;
    }
    if (mode) {
      where.mode = mode;
    }
    if (publishedOnly) {
      where.published = true;
    }

    return this.prisma.question.findMany({
      where,
      orderBy: [{ lessonId: 'asc' }, { mode: 'asc' }, { order: 'asc' }],
      include: {
        lesson: true,
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findQuestionById(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        lesson: true,
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!question) {
      throw new NotFoundException(`Question with id "${id}" not found`);
    }
    return question;
  }

  async findQuestionByQuestionId(questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { questionId },
      include: {
        lesson: true,
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!question) {
      throw new NotFoundException(`Question with questionId "${questionId}" not found`);
    }
    return question;
  }

  async updateQuestion(id: string, dto: UpdateQuestionDto) {
    const question = await this.findQuestionById(id);

    // If lessonId is being changed, verify new lesson exists
    if (dto.lessonId && dto.lessonId !== question.lessonId) {
      const lesson = await this.prisma.lesson.findUnique({
        where: { lessonId: dto.lessonId },
      });
      if (!lesson) {
        throw new NotFoundException(`Lesson with lessonId "${dto.lessonId}" not found`);
      }
    }

    // If order is being updated, check for duplicates and auto-shift if needed
    if (dto.order !== undefined && dto.order !== question.order) {
      await this.ensureUniqueOrder('question', id, dto.order, question.lessonId, question.mode);
    }

    // Update question
    const updated = await this.prisma.question.update({
      where: { id },
      data: {
        ...(dto.lessonId !== undefined && { lessonId: dto.lessonId }),
        ...(dto.mode !== undefined && { mode: dto.mode }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.prompt !== undefined && { prompt: dto.prompt }),
        ...(dto.correctAnswer !== undefined && { correctAnswer: dto.correctAnswer }),
        ...(dto.explanation !== undefined && { explanation: dto.explanation }),
        ...(dto.hint !== undefined && { hint: dto.hint }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.published !== undefined && { published: dto.published }),
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Update options if provided
    if (dto.options) {
      // Delete existing options
      await this.prisma.questionOption.deleteMany({
        where: { questionId: id },
      });

      // Create new options
      await this.prisma.questionOption.createMany({
        data: dto.options.map((opt, idx) => ({
          questionId: id,
          text: opt.text,
          isCorrect: opt.isCorrect,
          order: opt.order ?? idx,
        })),
      });

      // Reload with updated options
      return this.findQuestionById(id);
    }

    return updated;
  }

  async updateQuestionByQuestionId(questionId: string, dto: UpdateQuestionDto) {
    const question = await this.findQuestionByQuestionId(questionId);
    return this.updateQuestion(question.id, dto);
  }

  async deleteQuestion(id: string) {
    const question = await this.findQuestionById(id);
    
    // Options are cascade deleted, so we can delete directly
    return this.prisma.question.delete({
      where: { id },
    });
  }

  async deleteQuestionByQuestionId(questionId: string) {
    const question = await this.findQuestionByQuestionId(questionId);
    return this.deleteQuestion(question.id);
  }

  // ============================================
  // Publish/Unpublish
  // ============================================

  async publishUnit(id: string) {
    return this.updateUnit(id, { published: true });
  }

  async unpublishUnit(id: string) {
    return this.updateUnit(id, { published: false });
  }

  async publishLesson(id: string) {
    return this.updateLesson(id, { published: true });
  }

  async unpublishLesson(id: string) {
    return this.updateLesson(id, { published: false });
  }

  async publishQuestion(id: string) {
    return this.updateQuestion(id, { published: true });
  }

  async unpublishQuestion(id: string) {
    return this.updateQuestion(id, { published: false });
  }

  // ============================================
  // Order Management
  // ============================================

  async updateUnitOrder(id: string, order: number) {
    return this.updateUnit(id, { order });
  }

  async updateLessonOrder(id: string, order: number) {
    return this.updateLesson(id, { order });
  }

  async updateQuestionOrder(id: string, order: number) {
    return this.updateQuestion(id, { order });
  }

  // ============================================
  // Order Validation & Auto-Shift
  // ============================================

  /**
   * Ensures unique order values by auto-shifting conflicting items
   * @param entityType - 'unit' | 'lesson' | 'question'
   * @param excludeId - ID of entity being updated (to exclude from shift)
   * @param newOrder - New order value
   * @param unitId - For lessons: unitId to scope the check
   * @param lessonId - For questions: lessonId to scope the check
   * @param mode - For questions: mode to scope the check
   */
  private async ensureUniqueOrder(
    entityType: 'unit' | 'lesson' | 'question',
    excludeId: string,
    newOrder: number,
    unitId?: string,
    lessonId?: string,
    mode?: string,
  ) {
    if (entityType === 'unit') {
      // Find units with the same order
      const conflicting = await this.prisma.unit.findMany({
        where: {
          order: newOrder,
          id: { not: excludeId },
        },
      });

      // Shift conflicting units up by 1
      if (conflicting.length > 0) {
        await this.prisma.unit.updateMany({
          where: {
            id: { in: conflicting.map((u) => u.id) },
          },
          data: {
            order: { increment: 1 },
          },
        });
      }
    } else if (entityType === 'lesson') {
      // Find lessons with the same order in the same unit
      const conflicting = await this.prisma.lesson.findMany({
        where: {
          order: newOrder,
          unitId: unitId!,
          id: { not: excludeId },
        },
      });

      // Shift conflicting lessons up by 1
      if (conflicting.length > 0) {
        await this.prisma.lesson.updateMany({
          where: {
            id: { in: conflicting.map((l) => l.id) },
          },
          data: {
            order: { increment: 1 },
          },
        });
      }
    } else if (entityType === 'question') {
      // Find questions with the same order in the same lesson and mode
      const conflicting = await this.prisma.question.findMany({
        where: {
          order: newOrder,
          lessonId: lessonId!,
          mode: mode!,
          id: { not: excludeId },
        },
      });

      // Shift conflicting questions up by 1
      if (conflicting.length > 0) {
        await this.prisma.question.updateMany({
          where: {
            id: { in: conflicting.map((q) => q.id) },
          },
          data: {
            order: { increment: 1 },
          },
        });
      }
    }
  }

  // ============================================
  // Bulk Reorder
  // ============================================

  async bulkReorderUnits(dto: BulkReorderUnitsDto) {
    return this.prisma.$transaction(async (tx) => {
      const updates = await Promise.all(
        dto.items.map(async (item) => {
          let unit;
          if (item.id) {
            unit = await tx.unit.findUnique({ where: { id: item.id } });
          } else if (item.unitId) {
            unit = await tx.unit.findUnique({ where: { unitId: item.unitId } });
          } else {
            throw new BadRequestException('Each item must have either "id" or "unitId"');
          }

          if (!unit) {
            throw new NotFoundException(
              `Unit not found: ${item.id ? `id="${item.id}"` : `unitId="${item.unitId}"`}`,
            );
          }

          return tx.unit.update({
            where: { id: unit.id },
            data: { order: item.order },
          });
        }),
      );

      return updates;
    });
  }

  async bulkReorderLessons(dto: BulkReorderLessonsDto) {
    return this.prisma.$transaction(async (tx) => {
      const updates = await Promise.all(
        dto.items.map(async (item) => {
          let lesson;
          if (item.id) {
            lesson = await tx.lesson.findUnique({ where: { id: item.id } });
          } else if (item.lessonId) {
            lesson = await tx.lesson.findUnique({ where: { lessonId: item.lessonId } });
          } else {
            throw new BadRequestException('Each item must have either "id" or "lessonId"');
          }

          if (!lesson) {
            throw new NotFoundException(
              `Lesson not found: ${item.id ? `id="${item.id}"` : `lessonId="${item.lessonId}"`}`,
            );
          }

          return tx.lesson.update({
            where: { id: lesson.id },
            data: { order: item.order },
          });
        }),
      );

      return updates;
    });
  }

  async bulkReorderQuestions(dto: BulkReorderQuestionsDto) {
    return this.prisma.$transaction(async (tx) => {
      const updates = await Promise.all(
        dto.items.map(async (item) => {
          let question;
          if (item.id) {
            question = await tx.question.findUnique({ where: { id: item.id } });
          } else if (item.questionId) {
            question = await tx.question.findUnique({ where: { questionId: item.questionId } });
          } else {
            throw new BadRequestException('Each item must have either "id" or "questionId"');
          }

          if (!question) {
            throw new NotFoundException(
              `Question not found: ${item.id ? `id="${item.id}"` : `questionId="${item.questionId}"`}`,
            );
          }

          return tx.question.update({
            where: { id: question.id },
            data: { order: item.order },
          });
        }),
      );

      return updates;
    });
  }
}

