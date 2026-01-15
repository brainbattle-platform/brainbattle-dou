import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../../storage/storage.service';

/**
 * Lookup audio URL for a question by questionId
 * Returns audioUrl if question has an associated AudioAsset
 */
export async function getAudioUrlForQuestion(
  questionId: string,
  prisma: PrismaService,
  storageService: StorageService,
): Promise<string | undefined> {
  try {
    // Find question in DB by questionId (legacy ID)
    const question = await prisma.question.findUnique({
      where: { questionId },
      select: { audioAssetId: true },
    });

    if (!question || !question.audioAssetId) {
      return undefined;
    }

    // Get audio asset
    const audioAsset = await prisma.audioAsset.findUnique({
      where: { id: question.audioAssetId },
      select: { key: true },
    });

    if (!audioAsset) {
      return undefined;
    }

    // Generate public URL
    return storageService.getPublicUrl(audioAsset.key, question.audioAssetId);
  } catch (error) {
    // If question not in DB or any error, return undefined
    return undefined;
  }
}

