import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * B1-level Reading (MCQ) questions
 * Topics: Work & routine, Travel, Daily life, Simple opinions
 * Grammar: past simple, present perfect, future with "going to", modals, comparatives
 */
const readingQuestions = [
  // Work & Routine
  {
    questionId: 'b1-r-01',
    lessonId: 'lesson-1-1',
    mode: 'reading',
    prompt: 'Sarah has a meeting at 3 PM today. What should she do?',
    options: [
      'She should arrive early',
      'She should cancel the meeting',
      'She should skip it',
      'She should reschedule for tomorrow',
    ],
    correctAnswer: 'She should arrive early',
    explanation: 'For meetings, it is polite and professional to arrive early or on time.',
    hint: 'Think about professional behavior in meetings.',
  },
  {
    questionId: 'b1-r-02',
    lessonId: 'lesson-1-1',
    mode: 'reading',
    prompt: 'Tom finished his project yesterday. He ___ working on it for two weeks.',
    options: ['has been', 'was', 'is', 'will be'],
    correctAnswer: 'has been',
    explanation: 'Present perfect continuous is used for actions that started in the past and continued until recently.',
    hint: 'The action started in the past and continued until "yesterday".',
  },
  {
    questionId: 'b1-r-03',
    lessonId: 'lesson-1-2',
    mode: 'reading',
    prompt: 'I need to send an email to my manager. What is the best way to start?',
    options: [
      'Hi Manager,',
      'Dear [Manager\'s name],',
      'Hey!',
      'To whom it may concern,',
    ],
    correctAnswer: 'Dear [Manager\'s name],',
    explanation: 'Professional emails should start with "Dear [Name]," followed by a comma.',
    hint: 'Consider formal email etiquette.',
  },
  {
    questionId: 'b1-r-04',
    lessonId: 'lesson-1-2',
    mode: 'reading',
    prompt: 'The deadline for the report is next Friday. When should you finish it?',
    options: [
      'On Friday',
      'Before Friday',
      'After Friday',
      'It doesn\'t matter',
    ],
    correctAnswer: 'Before Friday',
    explanation: 'A deadline means the work must be completed by that date, so finishing before is better.',
    hint: 'A deadline is the latest acceptable time.',
  },
  // Travel
  {
    questionId: 'b1-r-05',
    lessonId: 'lesson-1-3',
    mode: 'reading',
    prompt: 'You need to book a hotel room. What information do you need?',
    options: [
      'Only your name',
      'Check-in date, check-out date, and number of guests',
      'Just the price',
      'Nothing, you can book without details',
    ],
    correctAnswer: 'Check-in date, check-out date, and number of guests',
    explanation: 'Hotels require check-in/check-out dates and guest count to make a reservation.',
    hint: 'Think about what hotels need to reserve a room.',
  },
  {
    questionId: 'b1-r-06',
    lessonId: 'lesson-1-3',
    mode: 'reading',
    prompt: 'At the airport, you should arrive ___ before your flight.',
    options: ['5 minutes', '1 hour', '2-3 hours', 'the day before'],
    correctAnswer: '2-3 hours',
    explanation: 'International flights typically require arriving 2-3 hours early for check-in and security.',
    hint: 'Consider airport security and check-in time.',
  },
  {
    questionId: 'b1-r-07',
    lessonId: 'lesson-1-4',
    mode: 'reading',
    prompt: 'If you are lost, you could ask for directions. What is a polite way to ask?',
    options: [
      'Where is it?',
      'Excuse me, could you tell me how to get to...?',
      'I don\'t know where I am',
      'Just point',
    ],
    correctAnswer: 'Excuse me, could you tell me how to get to...?',
    explanation: 'Polite requests use "Excuse me" and "could you" to show respect.',
    hint: 'Politeness includes greetings and modal verbs like "could".',
  },
  {
    questionId: 'b1-r-08',
    lessonId: 'lesson-1-4',
    mode: 'reading',
    prompt: 'Train tickets are usually ___ expensive than plane tickets for short distances.',
    options: ['more', 'most', 'much', 'very'],
    correctAnswer: 'more',
    explanation: 'Comparative form "more + adjective" is used to compare two things.',
    hint: 'This sentence compares train and plane tickets.',
  },
  // Daily Life
  {
    questionId: 'b1-r-09',
    lessonId: 'lesson-1-5',
    mode: 'reading',
    prompt: 'You want to make a doctor\'s appointment. What should you say?',
    options: [
      'I need to see a doctor',
      'I want medicine',
      'I am sick yesterday',
      'Doctor, come here',
    ],
    correctAnswer: 'I need to see a doctor',
    explanation: 'Making an appointment requires stating your need clearly and politely.',
    hint: 'Appointments require clear, polite requests.',
  },
  {
    questionId: 'b1-r-10',
    lessonId: 'lesson-1-5',
    mode: 'reading',
    prompt: 'When shopping, you should compare prices. This means you should ___ different stores.',
    options: ['ignore', 'check', 'avoid', 'forget'],
    correctAnswer: 'check',
    explanation: 'To compare prices means to check and look at prices in different places.',
    hint: 'Comparing means looking at multiple options.',
  },
  {
    questionId: 'b1-r-11',
    lessonId: 'lesson-1-6',
    mode: 'reading',
    prompt: 'I ___ to the gym three times last week.',
    options: ['go', 'went', 'have gone', 'am going'],
    correctAnswer: 'went',
    explanation: 'Past simple "went" is used for completed actions in the past with a specific time ("last week").',
    hint: 'The time marker "last week" indicates a past completed action.',
  },
  {
    questionId: 'b1-r-12',
    lessonId: 'lesson-1-6',
    mode: 'reading',
    prompt: 'Which sentence shows a preference?',
    options: [
      'I like coffee',
      'I drink coffee',
      'I bought coffee',
      'I will drink coffee',
    ],
    correctAnswer: 'I like coffee',
    explanation: '"Like" expresses preference or opinion, while other verbs show actions.',
    hint: 'Preferences are about what you enjoy or prefer.',
  },
];

/**
 * B1-level Writing (TYPE_ANSWER) questions
 * Fill-in-the-blank and short answer questions
 * Answers should be 1-4 words
 */
const writingQuestions = [
  // Work & Routine
  {
    questionId: 'b1-w-01',
    lessonId: 'lesson-1-1',
    mode: 'writing',
    prompt: 'I ___ to the office by bus every morning.',
    correctAnswer: 'go',
    explanation: 'Present simple "go" is used for regular routines and habits.',
    placeholder: 'Type your answer (one word)',
    caseSensitive: false,
  },
  {
    questionId: 'b1-w-02',
    lessonId: 'lesson-1-1',
    mode: 'writing',
    prompt: 'What should you say when you arrive late to a meeting?',
    correctAnswer: 'Sorry I\'m late',
    explanation: 'Apologizing for lateness is polite and professional.',
    placeholder: 'Type your answer (2-4 words)',
    caseSensitive: false,
  },
  {
    questionId: 'b1-w-03',
    lessonId: 'lesson-1-2',
    mode: 'writing',
    prompt: 'I have ___ finished my homework. (complete the sentence with "just" or "already")',
    correctAnswer: 'just',
    explanation: '"Just" is used with present perfect to indicate something happened very recently.',
    placeholder: 'Type your answer (one word)',
    caseSensitive: false,
  },
  {
    questionId: 'b1-w-04',
    lessonId: 'lesson-1-2',
    mode: 'writing',
    prompt: 'What is a polite way to ask for help with a deadline?',
    correctAnswer: 'Could you help me',
    explanation: 'Using "Could you" is polite when asking for assistance.',
    placeholder: 'Type your answer (3-4 words)',
    caseSensitive: false,
  },
  // Travel
  {
    questionId: 'b1-w-05',
    lessonId: 'lesson-1-3',
    mode: 'writing',
    prompt: 'I ___ going to visit Paris next month.',
    correctAnswer: 'am',
    explanation: '"Be going to" is used for future plans. Use "am" with "I".',
    placeholder: 'Type your answer (one word)',
    caseSensitive: false,
  },
  {
    questionId: 'b1-w-06',
    lessonId: 'lesson-1-3',
    mode: 'writing',
    prompt: 'What should you say when checking in at a hotel?',
    correctAnswer: 'I have a reservation',
    explanation: 'When checking in, you inform the hotel staff about your reservation.',
    placeholder: 'Type your answer (4 words)',
    caseSensitive: false,
  },
  {
    questionId: 'b1-w-07',
    lessonId: 'lesson-1-4',
    mode: 'writing',
    prompt: 'The train station is ___ than the bus stop. (use "farther" or "further")',
    correctAnswer: 'farther',
    explanation: '"Farther" is used for physical distance comparisons.',
    placeholder: 'Type your answer (one word)',
    caseSensitive: false,
  },
  {
    questionId: 'b1-w-08',
    lessonId: 'lesson-1-4',
    mode: 'writing',
    prompt: 'How do you politely ask for directions to the airport?',
    correctAnswer: 'Excuse me where is',
    explanation: 'Polite requests start with "Excuse me" followed by the question.',
    placeholder: 'Type your answer (3-4 words)',
    caseSensitive: false,
  },
  // Daily Life
  {
    questionId: 'b1-w-09',
    lessonId: 'lesson-1-5',
    mode: 'writing',
    prompt: 'I ___ to the doctor yesterday because I felt sick.',
    correctAnswer: 'went',
    explanation: 'Past simple "went" is used for completed actions in the past with a specific time.',
    placeholder: 'Type your answer (one word)',
    caseSensitive: false,
  },
  {
    questionId: 'b1-w-10',
    lessonId: 'lesson-1-5',
    mode: 'writing',
    prompt: 'What should you say when making a doctor\'s appointment?',
    correctAnswer: 'I need an appointment',
    explanation: 'Making appointments requires stating your need clearly.',
    placeholder: 'Type your answer (4 words)',
    caseSensitive: false,
  },
  {
    questionId: 'b1-w-11',
    lessonId: 'lesson-1-6',
    mode: 'writing',
    prompt: 'She ___ shopping last weekend. (use past simple)',
    correctAnswer: 'went',
    explanation: 'Past simple "went" is used for completed actions in the past.',
    placeholder: 'Type your answer (one word)',
    caseSensitive: false,
  },
  {
    questionId: 'b1-w-12',
    lessonId: 'lesson-1-6',
    mode: 'writing',
    prompt: 'What is a polite way to express your preference?',
    correctAnswer: 'I would prefer',
    explanation: '"I would prefer" is a polite way to express your choice or preference.',
    placeholder: 'Type your answer (3 words)',
    caseSensitive: false,
  },
];

async function main() {
  console.log('🌱 Seeding B1 reading and writing questions...\n');

  // Step 1: Delete old simple reading/writing questions (by prefix)
  console.log('🗑️  Deleting old simple questions...');
  
  const oldReadingQuestions = await prisma.question.findMany({
    where: {
      type: 'MCQ',
      mode: 'reading',
      questionId: {
        startsWith: 'q-reading-',
      },
    },
    select: { id: true },
  });

  const oldWritingQuestions = await prisma.question.findMany({
    where: {
      type: 'TYPE_ANSWER',
      mode: 'writing',
      questionId: {
        startsWith: 'q-writing-',
      },
    },
    select: { id: true },
  });

  // Delete options first (foreign key constraint)
  if (oldReadingQuestions.length > 0) {
    const oldReadingIds = oldReadingQuestions.map((q) => q.id);
    await prisma.questionOption.deleteMany({
      where: {
        questionId: {
          in: oldReadingIds,
        },
      },
    });
    console.log(`   Deleted ${oldReadingQuestions.length} old reading question options`);
  }

  // Delete questions
  if (oldReadingQuestions.length > 0) {
    await prisma.question.deleteMany({
      where: {
        id: {
          in: oldReadingQuestions.map((q) => q.id),
        },
      },
    });
    console.log(`   Deleted ${oldReadingQuestions.length} old reading questions`);
  }

  if (oldWritingQuestions.length > 0) {
    await prisma.question.deleteMany({
      where: {
        id: {
          in: oldWritingQuestions.map((q) => q.id),
        },
      },
    });
    console.log(`   Deleted ${oldWritingQuestions.length} old writing questions`);
  }

  // Step 2: Ensure Unit and Lessons exist
  console.log('\n📚 Ensuring Unit and Lessons exist...');
  
  await prisma.unit.upsert({
    where: { unitId: 'unit-1' },
    update: {},
    create: {
      unitId: 'unit-1',
      title: 'Unit 1: Daily Life & Work',
      published: true,
      order: 1,
    },
  });

  const lessonIds = ['lesson-1-1', 'lesson-1-2', 'lesson-1-3', 'lesson-1-4', 'lesson-1-5', 'lesson-1-6'];
  for (const lessonId of lessonIds) {
    await prisma.lesson.upsert({
      where: { lessonId },
      update: {},
      create: {
        lessonId,
        unitId: 'unit-1',
        title: `Lesson ${lessonId.split('-')[1]}-${lessonId.split('-')[2]}`,
        published: true,
        order: parseInt(lessonId.split('-')[2]) || 0,
      },
    });
  }
  console.log(`   ✅ Ensured Unit and ${lessonIds.length} Lessons`);

  // Step 3: Seed Reading (MCQ) questions
  console.log('\n📖 Seeding Reading (MCQ) questions...');
  let readingCount = 0;

  for (const q of readingQuestions) {
    try {
      const createdQuestion = await prisma.question.upsert({
        where: { questionId: q.questionId },
        update: {
          prompt: q.prompt,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          hint: q.hint,
          mode: q.mode,
          type: 'MCQ',
          published: true,
        },
        create: {
          questionId: q.questionId,
          lessonId: q.lessonId,
          mode: q.mode,
          type: 'MCQ',
          prompt: q.prompt,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          hint: q.hint,
          published: true,
          order: 0,
        },
        select: { id: true },
      });

      // Delete existing options
      await prisma.questionOption.deleteMany({
        where: { questionId: createdQuestion.id },
      });

      // Create options
      for (let i = 0; i < q.options.length; i++) {
        await prisma.questionOption.create({
          data: {
            questionId: createdQuestion.id,
            text: q.options[i],
            isCorrect: q.options[i] === q.correctAnswer,
            order: i,
          },
        });
      }

      readingCount++;
      console.log(`   ✅ ${q.questionId}: ${q.prompt.substring(0, 50)}...`);
    } catch (error: any) {
      console.error(`   ❌ Failed to seed ${q.questionId}:`, error.message);
    }
  }

  // Step 4: Seed Writing (TYPE_ANSWER) questions
  console.log('\n✍️  Seeding Writing (TYPE_ANSWER) questions...');
  let writingCount = 0;

  for (const q of writingQuestions) {
    try {
      await prisma.question.upsert({
        where: { questionId: q.questionId },
        update: {
          prompt: q.prompt,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          placeholder: q.placeholder,
          caseSensitive: q.caseSensitive,
          mode: q.mode,
          type: 'TYPE_ANSWER',
          published: true,
        },
        create: {
          questionId: q.questionId,
          lessonId: q.lessonId,
          mode: q.mode,
          type: 'TYPE_ANSWER',
          prompt: q.prompt,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          placeholder: q.placeholder,
          caseSensitive: q.caseSensitive,
          published: true,
          order: 0,
        },
      });

      writingCount++;
      console.log(`   ✅ ${q.questionId}: ${q.prompt.substring(0, 50)}...`);
    } catch (error: any) {
      console.error(`   ❌ Failed to seed ${q.questionId}:`, error.message);
    }
  }

  console.log('\n🎉 Seed completed!');
  console.log(`📊 Created ${readingCount} Reading (MCQ) questions`);
  console.log(`📊 Created ${writingCount} Writing (TYPE_ANSWER) questions`);
  console.log(`\n✅ All B1-level questions are ready!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

