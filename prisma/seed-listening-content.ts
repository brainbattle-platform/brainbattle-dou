import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import axios, { AxiosError } from 'axios';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// MinIO configuration from environment
const minioEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
const minioPort = parseInt(process.env.MINIO_PORT || '9000', 10);
const minioUseSSL = process.env.MINIO_USE_SSL === 'true';
const minioAccessKey = process.env.MINIO_ACCESS_KEY || 'minio-root';
const minioSecretKey = process.env.MINIO_SECRET_KEY || 'minio-root-secret';
const minioBucket = process.env.MINIO_BUCKET_NAME || 'bb-learning';
const minioRegion = process.env.MINIO_REGION || 'us-east-1';

const endpointUrl = minioUseSSL ? `https://${minioEndpoint}:${minioPort}` : `http://${minioEndpoint}:${minioPort}`;

const s3Client = new S3Client({
  endpoint: endpointUrl,
  region: minioRegion,
  credentials: {
    accessKeyId: minioAccessKey,
    secretAccessKey: minioSecretKey,
  },
  forcePathStyle: true,
});

/**
 * Sleep helper for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Download file from URL with retry logic
 * - Sets proper headers (User-Agent, Accept)
 * - Follows redirects (max 5)
 * - Retries 3 times for 403/429/5xx with backoff (500ms, 1000ms, 2000ms)
 */
async function downloadFile(url: string, retryCount = 0): Promise<Buffer> {
  const maxRetries = 3;
  const backoffDelays = [500, 1000, 2000]; // ms

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      maxRedirects: 5,
      headers: {
        'User-Agent': 'brainbattle-seeder/1.0 (demo; contact: dev)',
        Accept: '*/*',
      },
      timeout: 30000, // 30 seconds
    });

    if (response.status === 200 && response.data) {
      return Buffer.from(response.data);
    }

    throw new Error(`Unexpected status: ${response.status}`);
  } catch (error: any) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status || 0;
    const shouldRetry =
      retryCount < maxRetries &&
      (status === 403 || status === 429 || (status >= 500 && status < 600));

    if (shouldRetry) {
      const delay = backoffDelays[retryCount] || 2000;
      console.log(
        `⚠️  Download failed (${status}), retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`,
      );
      await sleep(delay);
      return downloadFile(url, retryCount + 1);
    }

    // Final failure - throw error
    throw new Error(
      `Failed to download after ${retryCount + 1} attempts: ${status} ${axiosError.message}`,
    );
  }
}

/**
 * Ensure bucket exists
 */
async function ensureBucketExists() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: minioBucket }));
    console.log(`✅ Bucket '${minioBucket}' already exists`);
  } catch (error: any) {
    // Check for connection errors first
    if (error.code === 'ECONNREFUSED' || error.name === 'ECONNREFUSED') {
      throw error; // Re-throw to be caught by main()
    }
    // If bucket doesn't exist (404), create it
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log(`📦 Creating bucket '${minioBucket}'...`);
      await s3Client.send(new CreateBucketCommand({ Bucket: minioBucket }));
      console.log(`✅ Bucket '${minioBucket}' created`);
    } else {
      throw error;
    }
  }
}

/**
 * Upload buffer to MinIO
 */
async function uploadToMinIO(key: string, buffer: Buffer, contentType: string): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: minioBucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
}

/**
 * B1-level listening questions with audio
 */
const listeningQuestions = [
  {
    questionId: 'q-listening-b1-01',
    lessonId: 'lesson-1-1', // First lesson
    mode: 'listening',
    prompt: 'Where is Anna?',
    options: ['In the classroom', 'In the bathroom', 'In the library', 'In the kitchen'],
    correctAnswer: 'In the bathroom',
    explanation: 'The audio says "I am in the bathroom"',
    hint: 'Listen for the location mentioned',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Anna_Where_are_you_Marsha%2C_I_am_in_the_bathroom%21.ogg',
    audioFilename: 'anna-bathroom.ogg',
  },
  {
    questionId: 'q-listening-b1-02',
    lessonId: 'lesson-1-1',
    mode: 'listening',
    prompt: 'What does Anna need?',
    options: ['A pen', 'A book', 'A phone', 'A computer'],
    correctAnswer: 'A pen',
    explanation: 'The audio asks "Anna, do you have a pen?"',
    hint: 'Listen for what is being asked for',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Anna%2C_do_you_have_a_pen.ogg',
    audioFilename: 'anna-pen.ogg',
  },
  {
    questionId: 'q-listening-b1-03',
    lessonId: 'lesson-1-2',
    mode: 'listening',
    prompt: 'What technology is mentioned in the audio?',
    options: ['Image recognition', 'Self-driving cars', 'Both image recognition and self-driving', 'Neither'],
    correctAnswer: 'Both image recognition and self-driving',
    explanation: 'The audio mentions "Computer vision is used in image recognition systems and also in self-driving technologies"',
    hint: 'Listen for multiple technologies mentioned',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Computer_vision_is_used_in_image_recognition_systems_and_also_in_self-driving_technologies.ogg',
    audioFilename: 'computer-vision.ogg',
  },
  {
    questionId: 'q-listening-b1-04',
    lessonId: 'lesson-1-2',
    mode: 'listening',
    prompt: 'What does a neural network simulate?',
    options: ['A computer', 'The human brain', 'A robot', 'A database'],
    correctAnswer: 'The human brain',
    explanation: 'The audio says "A neural network is a computer system built to simulate, or act like, the human brain"',
    hint: 'Listen for what is being simulated',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/A_neural_network_is_a_computer_system_built_to_simulate%2C_or_act_like%2C_the_human_brain.ogg',
    audioFilename: 'neural-network.ogg',
  },
  {
    questionId: 'q-listening-b1-05',
    lessonId: 'lesson-1-3',
    mode: 'listening',
    prompt: 'Where is Anna? (Repeat for variety)',
    options: ['In the classroom', 'In the bathroom', 'In the library', 'In the kitchen'],
    correctAnswer: 'In the bathroom',
    explanation: 'The audio says "I am in the bathroom"',
    hint: 'Listen for the location',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Anna_Where_are_you_Marsha%2C_I_am_in_the_bathroom%21.ogg',
    audioFilename: 'anna-bathroom-2.ogg',
  },
  {
    questionId: 'q-listening-b1-06',
    lessonId: 'lesson-1-3',
    mode: 'listening',
    prompt: 'What does Anna need? (Repeat for variety)',
    options: ['A pen', 'A book', 'A phone', 'A computer'],
    correctAnswer: 'A pen',
    explanation: 'The audio asks "Anna, do you have a pen?"',
    hint: 'Listen for what is needed',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Anna%2C_do_you_have_a_pen.ogg',
    audioFilename: 'anna-pen-2.ogg',
  },
];

/**
 * Additional MCQ (reading) and TYPE_ANSWER (writing) questions for demo
 */
const additionalQuestions = [
  // Reading (MCQ)
  {
    questionId: 'q-reading-b1-01',
    lessonId: 'lesson-1-1',
    mode: 'reading',
    prompt: 'What does "táo" mean in English?',
    options: ['Apple', 'Orange', 'Banana', 'Grape'],
    correctAnswer: 'Apple',
    explanation: '"Táo" is Vietnamese for "apple"',
  },
  {
    questionId: 'q-reading-b1-02',
    lessonId: 'lesson-1-1',
    mode: 'reading',
    prompt: 'What does "phòng tắm" mean?',
    options: ['Bedroom', 'Bathroom', 'Kitchen', 'Living room'],
    correctAnswer: 'Bathroom',
    explanation: '"Phòng tắm" means bathroom',
  },
  // Writing (TYPE_ANSWER)
  {
    questionId: 'q-writing-b1-01',
    lessonId: 'lesson-1-1',
    mode: 'writing',
    prompt: 'How do you say "apple" in Vietnamese?',
    correctAnswer: 'táo',
    explanation: 'The Vietnamese word for apple is "táo"',
    placeholder: 'Type your answer here',
    caseSensitive: false,
  },
  {
    questionId: 'q-writing-b1-02',
    lessonId: 'lesson-1-1',
    mode: 'writing',
    prompt: 'How do you say "bathroom" in Vietnamese?',
    correctAnswer: 'phòng tắm',
    explanation: 'The Vietnamese phrase for bathroom is "phòng tắm"',
    placeholder: 'Type your answer here',
    caseSensitive: false,
  },
];

async function main() {
  console.log('🌱 Seeding B1 listening content...\n');

  // Check if MinIO is available
  try {
    await ensureBucketExists();
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.name === 'ECONNREFUSED') {
      console.error('❌ MinIO is not running!');
      console.error('Please start MinIO first:');
      console.error('  Option 1: Start via docker-compose in brainbattle-infra/');
      console.error('    cd brainbattle-infra');
      console.error('    docker-compose up -d bb-minio');
      console.error('');
      console.error('  Option 2: Start MinIO manually');
      console.error('    docker run -d -p 9000:9000 -p 9001:9001 \\');
      console.error('      -e MINIO_ROOT_USER=minio-root \\');
      console.error('      -e MINIO_ROOT_PASSWORD=minio-root-secret \\');
      console.error('      minio/minio server /data --console-address ":9001"');
      console.error('');
      process.exit(1);
    }
    throw error;
  }

  // Process listening questions with audio
  let uploadedAudioCount = 0;
  let createdListeningQuestionsCount = 0;
  let skippedQuestionsCount = 0;

  for (const q of listeningQuestions) {
    try {
      console.log(`📥 Downloading audio: ${q.audioFilename}...`);
      let audioBuffer: Buffer;
      try {
        audioBuffer = await downloadFile(q.audioUrl);
        console.log(`✅ Downloaded ${(audioBuffer.length / 1024).toFixed(2)} KB`);
      } catch (downloadError: any) {
        console.warn(`⚠️  Failed to download audio for ${q.questionId}: ${downloadError.message}`);
        console.warn(`   Skipping question ${q.questionId} (no audio available)\n`);
        skippedQuestionsCount++;
        continue; // Skip this question entirely
      }

      // Generate unique key
      const uniqueId = randomBytes(16).toString('hex');
      const ext = q.audioFilename.split('.').pop() || 'ogg';
      const key = `audio/${uniqueId}.${ext}`;

      // Upload to MinIO
      console.log(`📤 Uploading to MinIO: ${key}...`);
      await uploadToMinIO(key, audioBuffer, 'audio/ogg');
      console.log(`✅ Uploaded to MinIO`);
      uploadedAudioCount++;

      // Create AudioAsset record
      const audioAsset = await prisma.audioAsset.create({
        data: {
          key,
          bucket: minioBucket,
          originalName: q.audioFilename,
          contentType: 'audio/ogg',
          size: audioBuffer.length,
        },
      });
      console.log(`✅ Created AudioAsset: ${audioAsset.id}`);

      // Ensure unit exists first
      await prisma.unit.upsert({
        where: { unitId: 'unit-1' },
        update: {},
        create: {
          unitId: 'unit-1',
          title: 'Unit 1',
          published: true,
          order: 1,
        },
      });

      // Ensure lesson exists in DB (create if not exists)
      await prisma.lesson.upsert({
        where: { lessonId: q.lessonId },
        update: {},
        create: {
          lessonId: q.lessonId,
          unitId: 'unit-1', // Default to first unit
          title: `Lesson ${q.lessonId}`,
          published: true,
          order: 0,
        },
      });

      // Create or update Question record
      const questionData: any = {
        questionId: q.questionId,
        lessonId: q.lessonId, // Use lessonId (business key)
        mode: q.mode,
        type: 'LISTEN_AND_SELECT',
        prompt: q.prompt,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        hint: q.hint,
        audioAssetId: audioAsset.id,
        published: true,
        order: 0,
      };

      await prisma.question.upsert({
        where: { questionId: q.questionId },
        update: questionData,
        create: questionData,
      });

      // Get question record to get internal ID
      const createdQuestion = await prisma.question.findUnique({
        where: { questionId: q.questionId },
        select: { id: true },
      });

      if (createdQuestion) {
        // Delete existing options
        await prisma.questionOption.deleteMany({
          where: { questionId: createdQuestion.id },
        });

        // Create question options
        for (let i = 0; i < q.options.length; i++) {
          await prisma.questionOption.create({
            data: {
              questionId: createdQuestion.id, // Use internal Prisma ID
              text: q.options[i],
              isCorrect: q.options[i] === q.correctAnswer,
              order: i,
            },
          });
        }
      }

      console.log(`✅ Created Question: ${q.questionId}\n`);
      createdListeningQuestionsCount++;
    } catch (error: any) {
      console.error(`❌ Failed to process ${q.questionId}:`, error.message);
      skippedQuestionsCount++;
    }
  }

  // Process additional questions (reading and writing)
  for (const q of additionalQuestions) {
    try {
      // Ensure unit exists first
      await prisma.unit.upsert({
        where: { unitId: 'unit-1' },
        update: {},
        create: {
          unitId: 'unit-1',
          title: 'Unit 1',
          published: true,
          order: 1,
        },
      });

      // Ensure lesson exists
      await prisma.lesson.upsert({
        where: { lessonId: q.lessonId },
        update: {},
        create: {
          lessonId: q.lessonId,
          unitId: 'unit-1',
          title: `Lesson ${q.lessonId}`,
          published: true,
          order: 0,
        },
      });

      const questionData: any = {
        questionId: q.questionId,
        lessonId: q.lessonId,
        mode: q.mode,
        type: q.mode === 'reading' ? 'MCQ' : 'TYPE_ANSWER',
        prompt: q.prompt,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        published: true,
        order: 0,
      };

      if (q.mode === 'writing') {
        questionData.placeholder = (q as any).placeholder || 'Type your answer here';
        questionData.caseSensitive = (q as any).caseSensitive || false;
      }

      await prisma.question.upsert({
        where: { questionId: q.questionId },
        update: questionData,
        create: questionData,
      });

      // Create question options for MCQ
      if (q.mode === 'reading' && (q as any).options) {
        const createdQuestion = await prisma.question.findUnique({
          where: { questionId: q.questionId },
          select: { id: true },
        });

        if (createdQuestion) {
          await prisma.questionOption.deleteMany({
            where: { questionId: createdQuestion.id },
          });

          for (let i = 0; i < (q as any).options.length; i++) {
            await prisma.questionOption.create({
              data: {
                questionId: createdQuestion.id,
                text: (q as any).options[i],
                isCorrect: (q as any).options[i] === q.correctAnswer,
                order: i,
              },
            });
          }
        }
      }

      console.log(`✅ Created Question: ${q.questionId}`);
    } catch (error) {
      console.error(`❌ Failed to process ${q.questionId}:`, error);
    }
  }

  console.log('\n🎉 Seed completed!');
  console.log(`📊 Uploaded audio files: ${uploadedAudioCount}`);
  console.log(`📊 Created listening questions: ${createdListeningQuestionsCount}`);
  if (skippedQuestionsCount > 0) {
    console.log(`⚠️  Skipped questions (audio download failed): ${skippedQuestionsCount}`);
  }
  console.log(`📊 Created ${additionalQuestions.length} additional questions (reading/writing)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

