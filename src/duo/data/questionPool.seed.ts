export type Mode = 'listening' | 'speaking' | 'reading' | 'writing';

export interface Question {
  questionId: string;
  mode: Mode;
  type: 'mcq';
  prompt: string;
  choices: string[];
  correctAnswer: string;
  explanation?: string;
  hint?: string;
}

// Generate 25 questions per mode = 100 total questions
export function generateQuestionPool(): Question[] {
  const pool: Question[] = [];
  const modes: Mode[] = ['listening', 'speaking', 'reading', 'writing'];
  
  const prompts = {
    listening: [
      'Listen and select the correct meaning of "apple"',
      'Listen and select the correct meaning of "orange"',
      'Listen and select the correct meaning of "banana"',
      'Listen and select the correct meaning of "grape"',
      'Listen and select the correct meaning of "water"',
      'Listen and select the correct meaning of "hello"',
      'Listen and select the correct meaning of "thank you"',
      'Listen and select the correct meaning of "goodbye"',
      'Listen and select the correct meaning of "please"',
      'Listen and select the correct meaning of "sorry"',
      'Listen and select the correct meaning of "yes"',
      'Listen and select the correct meaning of "no"',
      'Listen and select the correct meaning of "one"',
      'Listen and select the correct meaning of "two"',
      'Listen and select the correct meaning of "three"',
      'Listen and select the correct meaning of "four"',
      'Listen and select the correct meaning of "five"',
      'Listen and select the correct meaning of "red"',
      'Listen and select the correct meaning of "blue"',
      'Listen and select the correct meaning of "green"',
      'Listen and select the correct meaning of "yellow"',
      'Listen and select the correct meaning of "black"',
      'Listen and select the correct meaning of "white"',
      'Listen and select the correct meaning of "dog"',
      'Listen and select the correct meaning of "cat"',
    ],
    speaking: [
      'How do you say "apple" in Vietnamese?',
      'How do you say "orange" in Vietnamese?',
      'How do you say "banana" in Vietnamese?',
      'How do you say "grape" in Vietnamese?',
      'How do you say "water" in Vietnamese?',
      'How do you say "hello" in Vietnamese?',
      'How do you say "thank you" in Vietnamese?',
      'How do you say "goodbye" in Vietnamese?',
      'How do you say "please" in Vietnamese?',
      'How do you say "sorry" in Vietnamese?',
      'How do you say "yes" in Vietnamese?',
      'How do you say "no" in Vietnamese?',
      'How do you say "one" in Vietnamese?',
      'How do you say "two" in Vietnamese?',
      'How do you say "three" in Vietnamese?',
      'How do you say "four" in Vietnamese?',
      'How do you say "five" in Vietnamese?',
      'How do you say "red" in Vietnamese?',
      'How do you say "blue" in Vietnamese?',
      'How do you say "green" in Vietnamese?',
      'How do you say "yellow" in Vietnamese?',
      'How do you say "black" in Vietnamese?',
      'How do you say "white" in Vietnamese?',
      'How do you say "dog" in Vietnamese?',
      'How do you say "cat" in Vietnamese?',
    ],
    reading: [
      'Read and select the correct meaning of "táo"',
      'Read and select the correct meaning of "cam"',
      'Read and select the correct meaning of "chuối"',
      'Read and select the correct meaning of "nho"',
      'Read and select the correct meaning of "nước"',
      'Read and select the correct meaning of "xin chào"',
      'Read and select the correct meaning of "cảm ơn"',
      'Read and select the correct meaning of "tạm biệt"',
      'Read and select the correct meaning of "xin lỗi"',
      'Read and select the correct meaning of "vui lòng"',
      'Read and select the correct meaning of "có"',
      'Read and select the correct meaning of "không"',
      'Read and select the correct meaning of "một"',
      'Read and select the correct meaning of "hai"',
      'Read and select the correct meaning of "ba"',
      'Read and select the correct meaning of "bốn"',
      'Read and select the correct meaning of "năm"',
      'Read and select the correct meaning of "đỏ"',
      'Read and select the correct meaning of "xanh dương"',
      'Read and select the correct meaning of "xanh lá"',
      'Read and select the correct meaning of "vàng"',
      'Read and select the correct meaning of "đen"',
      'Read and select the correct meaning of "trắng"',
      'Read and select the correct meaning of "chó"',
      'Read and select the correct meaning of "mèo"',
    ],
    writing: [
      'Write the Vietnamese word for "apple"',
      'Write the Vietnamese word for "orange"',
      'Write the Vietnamese word for "banana"',
      'Write the Vietnamese word for "grape"',
      'Write the Vietnamese word for "water"',
      'Write the Vietnamese greeting for "hello"',
      'Write the Vietnamese phrase for "thank you"',
      'Write the Vietnamese phrase for "goodbye"',
      'Write the Vietnamese word for "please"',
      'Write the Vietnamese word for "sorry"',
      'Write the Vietnamese word for "yes"',
      'Write the Vietnamese word for "no"',
      'Write the Vietnamese word for "one"',
      'Write the Vietnamese word for "two"',
      'Write the Vietnamese word for "three"',
      'Write the Vietnamese word for "four"',
      'Write the Vietnamese word for "five"',
      'Write the Vietnamese word for "red"',
      'Write the Vietnamese word for "blue"',
      'Write the Vietnamese word for "green"',
      'Write the Vietnamese word for "yellow"',
      'Write the Vietnamese word for "black"',
      'Write the Vietnamese word for "white"',
      'Write the Vietnamese word for "dog"',
      'Write the Vietnamese word for "cat"',
    ],
  };

  const answers = [
    ['táo', 'cam', 'chuối', 'nho'],
    ['cam', 'táo', 'chuối', 'nho'],
    ['chuối', 'táo', 'cam', 'nho'],
    ['nho', 'táo', 'cam', 'chuối'],
    ['nước', 'trời', 'đất', 'lửa'],
    ['xin chào', 'cảm ơn', 'tạm biệt', 'chào buổi sáng'],
    ['cảm ơn', 'xin chào', 'tạm biệt', 'chào buổi sáng'],
    ['tạm biệt', 'xin chào', 'cảm ơn', 'chào buổi sáng'],
    ['xin lỗi', 'xin chào', 'cảm ơn', 'tạm biệt'],
    ['vui lòng', 'xin chào', 'cảm ơn', 'tạm biệt'],
    ['có', 'không', 'có lẽ', 'không chắc'],
    ['không', 'có', 'có lẽ', 'không chắc'],
    ['một', 'hai', 'ba', 'bốn'],
    ['hai', 'một', 'ba', 'bốn'],
    ['ba', 'một', 'hai', 'bốn'],
    ['bốn', 'một', 'hai', 'ba'],
    ['năm', 'một', 'hai', 'ba'],
    ['đỏ', 'xanh dương', 'xanh lá', 'vàng'],
    ['xanh dương', 'đỏ', 'xanh lá', 'vàng'],
    ['xanh lá', 'đỏ', 'xanh dương', 'vàng'],
    ['vàng', 'đỏ', 'xanh dương', 'xanh lá'],
    ['đen', 'trắng', 'đỏ', 'xanh'],
    ['trắng', 'đen', 'đỏ', 'xanh'],
    ['chó', 'mèo', 'gà', 'vịt'],
    ['mèo', 'chó', 'gà', 'vịt'],
  ];

  const correctAnswers = [
    'táo', 'cam', 'chuối', 'nho', 'nước',
    'xin chào', 'cảm ơn', 'tạm biệt', 'xin lỗi', 'vui lòng',
    'có', 'không', 'một', 'hai', 'ba',
    'bốn', 'năm', 'đỏ', 'xanh dương', 'xanh lá',
    'vàng', 'đen', 'trắng', 'chó', 'mèo',
  ];

  const englishChoices = [
    ['apple', 'orange', 'banana', 'grape'],
    ['orange', 'apple', 'banana', 'grape'],
    ['banana', 'apple', 'orange', 'grape'],
    ['grape', 'apple', 'orange', 'banana'],
    ['water', 'sky', 'earth', 'fire'],
    ['Hello', 'Thank you', 'Goodbye', 'Good morning'],
    ['Thank you', 'Hello', 'Goodbye', 'Good morning'],
    ['Goodbye', 'Hello', 'Thank you', 'Good morning'],
    ['Sorry', 'Hello', 'Thank you', 'Goodbye'],
    ['Please', 'Hello', 'Thank you', 'Goodbye'],
    ['Yes', 'No', 'Maybe', 'Not sure'],
    ['No', 'Yes', 'Maybe', 'Not sure'],
    ['one', 'two', 'three', 'four'],
    ['two', 'one', 'three', 'four'],
    ['three', 'one', 'two', 'four'],
    ['four', 'one', 'two', 'three'],
    ['five', 'one', 'two', 'three'],
    ['red', 'blue', 'green', 'yellow'],
    ['blue', 'red', 'green', 'yellow'],
    ['green', 'red', 'blue', 'yellow'],
    ['yellow', 'red', 'blue', 'green'],
    ['black', 'white', 'red', 'blue'],
    ['white', 'black', 'red', 'blue'],
    ['dog', 'cat', 'chicken', 'duck'],
    ['cat', 'dog', 'chicken', 'duck'],
  ];

  modes.forEach((mode, modeIndex) => {
    for (let i = 0; i < 25; i++) {
      const questionIndex = modeIndex * 25 + i;
      const prompt = prompts[mode][i];
      
      let choices: string[];
      let correctAnswer: string;
      
      if (mode === 'reading') {
        // Reading: Vietnamese word -> English meaning
        choices = englishChoices[i];
        correctAnswer = choices[0]; // First choice is correct for reading
      } else {
        // Other modes: English -> Vietnamese
        choices = answers[i];
        correctAnswer = correctAnswers[i];
      }
      
      pool.push({
        questionId: `q-${mode}-${String(i + 1).padStart(2, '0')}`,
        mode,
        type: 'mcq',
        prompt,
        choices,
        correctAnswer,
        explanation: `The correct answer is "${correctAnswer}".`,
        hint: `Think about the ${mode} context.`,
      });
    }
  });

  return pool;
}

export const QUESTION_POOL_SEED: Question[] = generateQuestionPool();

