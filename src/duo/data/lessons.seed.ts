export interface Lesson {
  lessonId: string;
  unitId: string;
  title: string;
  subtitle?: string;
  order: number;
  estimatedMinutes: number;
}

export function generateLessonsSeed(): Lesson[] {
  const lessons: Lesson[] = [];
  
  // 20 units, 3 planets per unit = 60 total
  for (let unitIndex = 1; unitIndex <= 20; unitIndex++) {
    const unitId = `unit-${unitIndex}`;
    
    for (let planetIndex = 1; planetIndex <= 3; planetIndex++) {
      const lessonId = `lesson-${unitIndex}-${planetIndex}`;
      lessons.push({
        lessonId,
        unitId,
        title: `Lesson ${planetIndex}`,
        subtitle: `Practice ${unitIndex} - ${planetIndex}`,
        order: planetIndex,
        estimatedMinutes: 3,
      });
    }
  }
  
  return lessons;
}

export const LESSONS_SEED: Lesson[] = generateLessonsSeed();

