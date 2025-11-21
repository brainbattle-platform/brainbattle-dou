import { Injectable } from '@nestjs/common';

export type LessonStatus = 'locked' | 'available' | 'completed';

export interface LessonSummary {
  id: number;
  title: string;
  order: number;
  status: LessonStatus;
}

@Injectable()
export class LessonService {
  // Demo in-memory data; replace with real repository/DB later
  private lessons = [
    { id: 101, skillId: 11, title: 'Lesson 1', order: 1 },
    { id: 102, skillId: 11, title: 'Lesson 2', order: 2 },
  ];

  private exercises = [
    { id: 1001, lessonId: 101, type: 'MCQ', order: 1 },
    { id: 1002, lessonId: 101, type: 'FILL_IN', order: 2 },
  ];

  getLessonsBySkill(skillId: number, userId: string): LessonSummary[] {
    const filtered = this.lessons.filter((l) => l.skillId === skillId);
    return filtered.map((l, index) => ({
      id: l.id,
      title: l.title,
      order: l.order,
      status: index === 0 ? 'available' : 'locked',
    }));
  }

  getLessonDetail(lessonId: number) {
    const lesson = this.lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }
    const exercises = this.exercises
      .filter((e) => e.lessonId === lessonId)
      .map((e) => ({ id: e.id, type: e.type, order: e.order }));

    return {
      id: lesson.id,
      title: lesson.title,
      skillId: lesson.skillId,
      description: 'Demo lesson description',
      exercises,
    };
  }
}
