import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking seeded listening questions...\n');

  // Check listening questions
  const listeningQuestions = await prisma.question.findMany({
    where: {
      type: 'LISTEN_AND_SELECT',
      mode: 'listening',
    },
    include: {
      audioAsset: true,
      options: true,
    },
  });

  console.log(`📊 Found ${listeningQuestions.length} listening questions`);
  
  if (listeningQuestions.length > 0) {
    console.log('\n✅ Listening questions already seeded:');
    listeningQuestions.forEach((q, idx) => {
      console.log(`  ${idx + 1}. ${q.questionId} - ${q.prompt}`);
      console.log(`     Audio: ${q.audioAsset ? '✅' : '❌'} (${q.audioAsset?.originalName || 'N/A'})`);
      console.log(`     Options: ${q.options.length}`);
    });
  } else {
    console.log('\n⚠️  No listening questions found. Run seed script:');
    console.log('   npm run seed:listening');
  }

  // Check audio assets
  const audioAssets = await prisma.audioAsset.findMany();
  console.log(`\n📊 Found ${audioAssets.length} audio assets in MinIO`);
  
  if (audioAssets.length > 0) {
    console.log('\n✅ Audio assets:');
    audioAssets.slice(0, 5).forEach((asset, idx) => {
      console.log(`  ${idx + 1}. ${asset.originalName} (${(asset.size / 1024).toFixed(2)} KB)`);
    });
    if (audioAssets.length > 5) {
      console.log(`  ... and ${audioAssets.length - 5} more`);
    }
  }

  // Check other question types
  const readingQuestions = await prisma.question.findMany({
    where: { type: 'MCQ', mode: 'reading' },
    include: { options: true },
    take: 2,
  });
  const writingQuestions = await prisma.question.findMany({
    where: { type: 'TYPE_ANSWER', mode: 'writing' },
    take: 2,
  });

  const readingCount = await prisma.question.count({
    where: { type: 'MCQ', mode: 'reading' },
  });
  const writingCount = await prisma.question.count({
    where: { type: 'TYPE_ANSWER', mode: 'writing' },
  });

  console.log(`\n📊 Other questions:`);
  console.log(`   Reading (MCQ): ${readingCount}`);
  console.log(`   Writing (TYPE_ANSWER): ${writingCount}`);

  // Show sample MCQ questions
  if (readingQuestions.length > 0) {
    console.log('\n📖 Sample Reading (MCQ) questions:');
    readingQuestions.forEach((q, idx) => {
      console.log(`\n   ${idx + 1}. ${q.questionId}: ${q.prompt}`);
      console.log(`      Options:`);
      q.options.forEach((opt, optIdx) => {
        const marker = opt.isCorrect ? '✓' : ' ';
        console.log(`        ${marker} ${optIdx + 1}. ${opt.text}`);
      });
      console.log(`      Explanation: ${q.explanation || 'N/A'}`);
    });
  }

  // Show sample TYPE_ANSWER questions (hide correct answer)
  if (writingQuestions.length > 0) {
    console.log('\n✍️  Sample Writing (TYPE_ANSWER) questions:');
    writingQuestions.forEach((q, idx) => {
      console.log(`\n   ${idx + 1}. ${q.questionId}: ${q.prompt}`);
      console.log(`      Placeholder: ${q.placeholder || 'N/A'}`);
      console.log(`      Case sensitive: ${q.caseSensitive ? 'Yes' : 'No'}`);
      console.log(`      Explanation: ${q.explanation || 'N/A'}`);
      console.log(`      Correct answer: [HIDDEN]`);
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

