import { Injectable } from '@nestjs/common';

export interface Exercise {
  exerciseId: string;
  mode: 'listening' | 'speaking' | 'reading' | 'writing';
  type: 'mcq' | 'fill_in';
  prompt: string;
  choices?: string[];
  correctAnswer: string;
  hint?: string;
}

@Injectable()
export class ExerciseService {
  // Seed data: 2 Units × 3 Planets × 4 exercises (modalities) = 24 exercises
  // Unit 1 (skill-1): Basics
  // Unit 2 (skill-2): Greetings
  
  private exercisesByLesson: Record<string, Exercise[]> = {
    // Unit 1, Planet 1 (lesson-1)
    'lesson-1': [
      {
        exerciseId: 'ex-1-listening',
        mode: 'listening',
        type: 'mcq',
        prompt: 'Listen and select the correct meaning of "apple"',
        choices: ['táo', 'cam', 'chuối', 'nho'],
        correctAnswer: 'táo',
        hint: 'Think of a red fruit',
      },
      {
        exerciseId: 'ex-1-speaking',
        mode: 'speaking',
        type: 'mcq',
        prompt: 'How do you say "apple" in Vietnamese?',
        choices: ['táo', 'cam', 'chuối', 'nho'],
        correctAnswer: 'táo',
      },
      {
        exerciseId: 'ex-1-reading',
        mode: 'reading',
        type: 'mcq',
        prompt: 'Read and select the correct meaning of "táo"',
        choices: ['apple', 'orange', 'banana', 'grape'],
        correctAnswer: 'apple',
      },
      {
        exerciseId: 'ex-1-writing',
        mode: 'writing',
        type: 'mcq',
        prompt: 'Write the Vietnamese word for "apple"',
        choices: ['táo', 'cam', 'chuối', 'nho'],
        correctAnswer: 'táo',
      },
    ],
    // Unit 1, Planet 2 (lesson-2)
    'lesson-2': [
      {
        exerciseId: 'ex-2-listening',
        mode: 'listening',
        type: 'mcq',
        prompt: 'Listen and select the correct meaning of "orange"',
        choices: ['táo', 'cam', 'chuối', 'nho'],
        correctAnswer: 'cam',
        hint: 'Think of an orange fruit',
      },
      {
        exerciseId: 'ex-2-speaking',
        mode: 'speaking',
        type: 'mcq',
        prompt: 'How do you say "orange" in Vietnamese?',
        choices: ['táo', 'cam', 'chuối', 'nho'],
        correctAnswer: 'cam',
      },
      {
        exerciseId: 'ex-2-reading',
        mode: 'reading',
        type: 'mcq',
        prompt: 'Read and select the correct meaning of "cam"',
        choices: ['apple', 'orange', 'banana', 'grape'],
        correctAnswer: 'orange',
      },
      {
        exerciseId: 'ex-2-writing',
        mode: 'writing',
        type: 'mcq',
        prompt: 'Write the Vietnamese word for "orange"',
        choices: ['táo', 'cam', 'chuối', 'nho'],
        correctAnswer: 'cam',
      },
    ],
    // Unit 1, Planet 3 (lesson-3)
    'lesson-3': [
      {
        exerciseId: 'ex-3-listening',
        mode: 'listening',
        type: 'mcq',
        prompt: 'Listen and select the correct meaning of "banana"',
        choices: ['táo', 'cam', 'chuối', 'nho'],
        correctAnswer: 'chuối',
      },
      {
        exerciseId: 'ex-3-speaking',
        mode: 'speaking',
        type: 'mcq',
        prompt: 'How do you say "banana" in Vietnamese?',
        choices: ['táo', 'cam', 'chuối', 'nho'],
        correctAnswer: 'chuối',
      },
      {
        exerciseId: 'ex-3-reading',
        mode: 'reading',
        type: 'mcq',
        prompt: 'Read and select the correct meaning of "chuối"',
        choices: ['apple', 'orange', 'banana', 'grape'],
        correctAnswer: 'banana',
      },
      {
        exerciseId: 'ex-3-writing',
        mode: 'writing',
        type: 'mcq',
        prompt: 'Write the Vietnamese word for "banana"',
        choices: ['táo', 'cam', 'chuối', 'nho'],
        correctAnswer: 'chuối',
      },
    ],
    // Unit 2, Planet 1 (lesson-4)
    'lesson-4': [
      {
        exerciseId: 'ex-4-listening',
        mode: 'listening',
        type: 'mcq',
        prompt: 'Listen and select the correct greeting "Hello"',
        choices: ['xin chào', 'cảm ơn', 'tạm biệt', 'chào buổi sáng'],
        correctAnswer: 'xin chào',
      },
      {
        exerciseId: 'ex-4-speaking',
        mode: 'speaking',
        type: 'mcq',
        prompt: 'How do you say "Hello" in Vietnamese?',
        choices: ['xin chào', 'cảm ơn', 'tạm biệt', 'chào buổi sáng'],
        correctAnswer: 'xin chào',
      },
      {
        exerciseId: 'ex-4-reading',
        mode: 'reading',
        type: 'mcq',
        prompt: 'Read and select the correct meaning of "xin chào"',
        choices: ['Hello', 'Thank you', 'Goodbye', 'Good morning'],
        correctAnswer: 'Hello',
      },
      {
        exerciseId: 'ex-4-writing',
        mode: 'writing',
        type: 'mcq',
        prompt: 'Write the Vietnamese greeting for "Hello"',
        choices: ['xin chào', 'cảm ơn', 'tạm biệt', 'chào buổi sáng'],
        correctAnswer: 'xin chào',
      },
    ],
    // Unit 2, Planet 2 (lesson-5)
    'lesson-5': [
      {
        exerciseId: 'ex-5-listening',
        mode: 'listening',
        type: 'mcq',
        prompt: 'Listen and select the correct meaning of "Thank you"',
        choices: ['xin chào', 'cảm ơn', 'tạm biệt', 'chào buổi sáng'],
        correctAnswer: 'cảm ơn',
      },
      {
        exerciseId: 'ex-5-speaking',
        mode: 'speaking',
        type: 'mcq',
        prompt: 'How do you say "Thank you" in Vietnamese?',
        choices: ['xin chào', 'cảm ơn', 'tạm biệt', 'chào buổi sáng'],
        correctAnswer: 'cảm ơn',
      },
      {
        exerciseId: 'ex-5-reading',
        mode: 'reading',
        type: 'mcq',
        prompt: 'Read and select the correct meaning of "cảm ơn"',
        choices: ['Hello', 'Thank you', 'Goodbye', 'Good morning'],
        correctAnswer: 'Thank you',
      },
      {
        exerciseId: 'ex-5-writing',
        mode: 'writing',
        type: 'mcq',
        prompt: 'Write the Vietnamese phrase for "Thank you"',
        choices: ['xin chào', 'cảm ơn', 'tạm biệt', 'chào buổi sáng'],
        correctAnswer: 'cảm ơn',
      },
    ],
    // Unit 2, Planet 3 (lesson-6)
    'lesson-6': [
      {
        exerciseId: 'ex-6-listening',
        mode: 'listening',
        type: 'mcq',
        prompt: 'Listen and select the correct meaning of "Goodbye"',
        choices: ['xin chào', 'cảm ơn', 'tạm biệt', 'chào buổi sáng'],
        correctAnswer: 'tạm biệt',
      },
      {
        exerciseId: 'ex-6-speaking',
        mode: 'speaking',
        type: 'mcq',
        prompt: 'How do you say "Goodbye" in Vietnamese?',
        choices: ['xin chào', 'cảm ơn', 'tạm biệt', 'chào buổi sáng'],
        correctAnswer: 'tạm biệt',
      },
      {
        exerciseId: 'ex-6-reading',
        mode: 'reading',
        type: 'mcq',
        prompt: 'Read and select the correct meaning of "tạm biệt"',
        choices: ['Hello', 'Thank you', 'Goodbye', 'Good morning'],
        correctAnswer: 'Goodbye',
      },
      {
        exerciseId: 'ex-6-writing',
        mode: 'writing',
        type: 'mcq',
        prompt: 'Write the Vietnamese phrase for "Goodbye"',
        choices: ['xin chào', 'cảm ơn', 'tạm biệt', 'chào buổi sáng'],
        correctAnswer: 'tạm biệt',
      },
    ],
  };

  getExercisesForLesson(lessonId: string): Exercise[] {
    const exercises = this.exercisesByLesson[lessonId] || [];
    // Ensure we always return exactly 4 exercises (one per modality) in order
    const modalities: Array<'listening' | 'speaking' | 'reading' | 'writing'> = [
      'listening',
      'speaking',
      'reading',
      'writing',
    ];
    
    const exercisesByMode = new Map<string, Exercise>();
    exercises.forEach((ex) => exercisesByMode.set(ex.mode, ex));
    
    // Return exercises in modality order, with fallback if missing
    return modalities.map((mode) => {
      const ex = exercisesByMode.get(mode);
      if (ex) return ex;
      // Fallback (should not happen with proper seed data)
      return {
        exerciseId: `${lessonId}-${mode}`,
        mode,
        type: 'mcq' as const,
        prompt: `Placeholder ${mode} exercise`,
        choices: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correctAnswer: 'Option 1',
      };
    });
  }

  getExercise(lessonId: string, exerciseId: string): Exercise | undefined {
    const exercises = this.getExercisesForLesson(lessonId);
    return exercises.find((e) => e.exerciseId === exerciseId);
  }

  checkAnswer(lessonId: string, exerciseId: string, answer: string): boolean {
    const exercise = this.getExercise(lessonId, exerciseId);
    if (!exercise) {
      return false;
    }
    return exercise.correctAnswer.toLowerCase() === answer.toLowerCase();
  }
}
