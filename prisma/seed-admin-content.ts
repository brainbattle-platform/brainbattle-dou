/**
 * Seed script to populate initial content from seed data
 * Run with: npx ts-node prisma/seed-admin-content.ts
 */

import { PrismaClient } from '@prisma/client';
import { UNITS_SEED } from '../src/duo/data/units.seed';
import { LESSONS_SEED } from '../src/duo/data/lessons.seed';
import { QUESTION_POOL_SEED } from '../src/duo/data/questionPool.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin content...');

  // Seed Units
  console.log('📦 Seeding units...');
  for (const unit of UNITS_SEED) {
    await prisma.unit.upsert({
      where: { unitId: unit.unitId },
      update: {
        title: unit.title,
        order: unit.order,
      },
      create: {
        unitId: unit.unitId,
        title: unit.title,
        order: unit.order,
        published: true, // Publish seed units by default
      },
    });
  }
  console.log(`✅ Seeded ${UNITS_SEED.length} units`);

  // Seed Lessons
  console.log('📚 Seeding lessons...');
  for (const lesson of LESSONS_SEED) {
    await prisma.lesson.upsert({
      where: { lessonId: lesson.lessonId },
      update: {
        title: lesson.title,
        subtitle: lesson.subtitle,
        order: lesson.order,
        estimatedMinutes: lesson.estimatedMinutes,
      },
      create: {
        lessonId: lesson.lessonId,
        unitId: lesson.unitId,
        title: lesson.title,
        subtitle: lesson.subtitle,
        order: lesson.order,
        estimatedMinutes: lesson.estimatedMinutes,
        published: true, // Publish seed lessons by default
      },
    });
  }
  console.log(`✅ Seeded ${LESSONS_SEED.length} lessons`);

  // Seed Questions
  console.log('❓ Seeding questions...');
  let questionCount = 0;
  for (const question of QUESTION_POOL_SEED) {
    // Find a lesson to attach this question to
    // For seed data, we'll attach questions to lessons based on a simple mapping
    // In production, you'd want a more sophisticated mapping
    const lessonIndex = Math.floor(questionCount / 4) % LESSONS_SEED.length;
    const lesson = LESSONS_SEED[lessonIndex];

    await prisma.question.upsert({
      where: { questionId: question.questionId },
      update: {
        prompt: question.prompt,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        hint: question.hint,
      },
      create: {
        questionId: question.questionId,
        lessonId: lesson.lessonId,
        mode: question.mode,
        type: question.type,
        prompt: question.prompt,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        hint: question.hint,
        order: questionCount % 25, // Order within mode
        published: true, // Publish seed questions by default
        options: {
          create: question.choices.map((choice, idx) => ({
            text: choice,
            isCorrect: choice === question.correctAnswer,
            order: idx,
          })),
        },
      },
    });
    questionCount++;
  }
  console.log(`✅ Seeded ${questionCount} questions`);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

