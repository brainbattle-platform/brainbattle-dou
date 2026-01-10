Quy ước chung

Base: /api/duo

Header: X-User-Id: 1 (hardcode)

Response envelope:

{ "ok": true, "data": {}, "error": null }


Lỗi:

{ "ok": false, "data": null, "error": { "code": "BAD_REQUEST", "message": "..." } }

5.1 Learning Map (Unit picker + map planets)
GET /api/duo/map

Mục đích: render màn map: unit hiện tại + danh sách planets trên quỹ đạo

Response

{
  "ok": true,
  "data": {
    "activeUnitId": "unit-1",
    "units": [
      { "unitId": "unit-1", "title": "Basics", "order": 1 },
      { "unitId": "unit-2", "title": "Greetings", "order": 2 }
    ],
    "planets": [
      {
        "lessonId": "lesson-1",
        "unitId": "unit-1",
        "title": "Numbers & Colors",
        "order": 1,
        "state": "available",
        "progress": { "completedModes": 1, "totalModes": 4 },
        "ui": { "orbitIndex": 0, "angle": 45, "size": "md" }
      },
      {
        "lessonId": "lesson-2",
        "unitId": "unit-1",
        "title": "Family",
        "order": 2,
        "state": "locked",
        "progress": { "completedModes": 0, "totalModes": 4 },
        "ui": { "orbitIndex": 0, "angle": 200, "size": "sm" }
      }
    ]
  },
  "error": null
}


ui giúp bạn đặt planet đúng vị trí như Figma (khỏi tính toán bên app).

5.2 Learning Map — Skill Picker (4 kỹ năng quanh planet)
GET /api/duo/lessons/{lessonId}/modes

Mục đích: bấm vào planet → hiện 4 skill: nghe/nói/đọc/viết và trạng thái từng cái

Response

{
  "ok": true,
  "data": {
    "lessonId": "lesson-1",
    "unitId": "unit-1",
    "title": "Numbers & Colors",
    "modes": [
      { "mode": "listening", "state": "available", "bestScore": 0.8 },
      { "mode": "speaking", "state": "available", "bestScore": 0.6 },
      { "mode": "reading", "state": "completed", "bestScore": 1.0 },
      { "mode": "writing", "state": "available", "bestScore": 0.0 }
    ]
  },
  "error": null
}

5.3 Lesson Detail — Speak (header + Start Lesson)
GET /api/duo/lessons/{lessonId}/detail?mode=speaking

Mục đích: render màn detail theo mode

Response

{
  "ok": true,
  "data": {
    "lessonId": "lesson-1",
    "unitId": "unit-1",
    "mode": "speaking",
    "title": "Numbers & Colors",
    "subtitle": "Master numbers and color vocabulary",
    "level": "A1",
    "heroIcon": "speaker",
    "cta": { "label": "Start Lesson" }
  },
  "error": null
}

5.4 Lesson Overview (estimated time, XP reward, streak protect, questions)

Có thể dùng endpoint detail bên trên và trả thêm overview fields, hoặc tách riêng.

GET /api/duo/lessons/{lessonId}/overview?mode=speaking

Response

{
  "ok": true,
  "data": {
    "lessonId": "lesson-1",
    "unitId": "unit-1",
    "mode": "speaking",
    "title": "Numbers & Colors",
    "subtitle": "Master numbers and color vocabulary",
    "estimatedMinutes": 3,
    "xpReward": 50,
    "questionCount": 5,
    "streakProtect": { "available": true },
    "hearts": {
      "current": 4,
      "max": 5,
      "regen": { "secondsPerHeart": 1800 }
    }
  },
  "error": null
}

5.5 Quiz — Multiple Choice (Question 1/5 + hearts + progress)
POST /api/duo/lesson/start

Mục đích: bấm Start Lesson → tạo session + trả câu 1..n

Request

{ "lessonId": "lesson-1", "mode": "speaking" }


Response

{
  "ok": true,
  "data": {
    "sessionId": "sess_abc123",
    "lessonId": "lesson-1",
    "mode": "speaking",
    "totalQuestions": 5,
    "hearts": { "current": 4, "max": 5 },
    "question": {
      "index": 1,
      "questionId": "q-1",
      "type": "mcq",
      "prompt": "What number comes after 5?",
      "choices": ["4", "6", "7", "8"],
      "hintAvailable": true
    }
  },
  "error": null
}


Ở MVP bạn có thể trả luôn questions[], nhưng UI kiểu Duolingo thường trả theo từng câu (đỡ payload). Bạn chọn 1 trong 2; mình spec theo “per question” cho hợp màn quiz.

5.6 Answer Review (Correct + Explanation + Next)
POST /api/duo/sessions/{sessionId}/answer

Request

{
  "questionId": "q-1",
  "answer": "6",
  "timeMs": 4200
}


Response (correct)

{
  "ok": true,
  "data": {
    "result": {
      "isCorrect": true,
      "correctAnswer": "6",
      "xpEarned": 10,
      "explanation": "The number after 5 is 6."
    },
    "hearts": { "current": 4, "max": 5 },
    "progress": { "answered": 1, "total": 5, "percent": 0.2 },
    "next": {
      "hasNext": true,
      "question": {
        "index": 2,
        "questionId": "q-2",
        "type": "mcq",
        "prompt": "Select 'Hello' in Vietnamese",
        "choices": ["Tạm biệt", "Xin chào", "Cảm ơn", "Xin lỗi"],
        "hintAvailable": true
      }
    }
  },
  "error": null
}


Response (wrong)

{
  "ok": true,
  "data": {
    "result": {
      "isCorrect": false,
      "correctAnswer": "6",
      "xpEarned": 0,
      "explanation": "After 5 comes 6."
    },
    "hearts": { "current": 3, "max": 5 },
    "progress": { "answered": 1, "total": 5, "percent": 0.2 },
    "next": { "hasNext": true, "question": { "index": 2, "questionId": "q-2", "type": "mcq", "prompt": "...", "choices": ["..."] } }
  },
  "error": null
}


Logic hearts: sai thì trừ 1.

5.7 Out of Hearts modal (Next heart in 30:00 + Practice to earn hearts)

Để UI show modal khi hết hearts, API answer trả flag.

Trong response answer nếu hết hearts:

{
  "ok": true,
  "data": {
    "result": { "isCorrect": false, "correctAnswer": "6", "xpEarned": 0, "explanation": "..." },
    "hearts": {
      "current": 0,
      "max": 5,
      "regen": { "nextHeartInSeconds": 1800 }
    },
    "outOfHearts": true,
    "actions": {
      "wait": true,
      "practiceToEarnHearts": { "endpoint": "/api/duo/practice/quick?reward=hearts" }
    }
  },
  "error": null
}

POST /api/duo/practice/quick?reward=hearts (optional nhưng hợp UI)

Response

{
  "ok": true,
  "data": {
    "hearts": { "current": 1, "max": 5 },
    "message": "You earned 1 heart!"
  },
  "error": null
}

5.8 Practice Hub (Weak skills + quick practice actions)
GET /api/duo/practice-hub

Response

{
  "ok": true,
  "data": {
    "weakSkills": [
      { "mode": "listening", "wrongRate": 0.6, "attemptCount": 10, "wrongCount": 6, "needsMoreData": false },
      { "mode": "writing", "wrongRate": 0.5, "attemptCount": 6, "wrongCount": 3, "needsMoreData": false },
      { "mode": "reading", "wrongRate": 0.2, "attemptCount": 5, "wrongCount": 1, "needsMoreData": false }
    ],
    "recommendedPractice": [
      { "mode": "listening", "unitId": "unit-1", "lessonId": "lesson-2" },
      { "mode": "writing", "unitId": "unit-1", "lessonId": "lesson-1" }
    ],
    "quickPractice": [
      { "type": "review_mistakes", "label": "Review all mistakes" },
      { "type": "spaced_repetition", "label": "Spaced repetition" }
    ],
    "generatedAt": "2026-01-10T10:00:00.000Z"
  },
  "error": null
}

5.9 Quiz — Match Words (matching game)
GET /api/duo/sessions/{sessionId}/question/{questionId}

Hoặc bạn reuse /answer trả next.question như ở trên. Với match words, question.type="match".

Question payload

{
  "ok": true,
  "data": {
    "question": {
      "index": 3,
      "questionId": "q-3",
      "type": "match",
      "title": "Match the words",
      "left": [
        { "id": "l1", "text": "Hello" },
        { "id": "l2", "text": "Bye" },
        { "id": "l3", "text": "Thank you" },
        { "id": "l4", "text": "Sorry" }
      ],
      "right": [
        { "id": "r1", "text": "Xin chào" },
        { "id": "r2", "text": "Tạm biệt" },
        { "id": "r3", "text": "Cảm ơn" },
        { "id": "r4", "text": "Xin lỗi" }
      ],
      "answerKey": null
    }
  },
  "error": null
}

POST /api/duo/sessions/{sessionId}/answer (same endpoint)

Request for match

{
  "questionId": "q-3",
  "answer": {
    "pairs": [
      { "leftId": "l1", "rightId": "r1" },
      { "leftId": "l2", "rightId": "r2" }
    ]
  }
}


Response giống 5.6, chỉ khác grading logic.

5.10 Hint sheet (bottom sheet hint)
GET /api/duo/questions/{questionId}/hint

Response

{
  "ok": true,
  "data": {
    "questionId": "q-1",
    "hint": {
      "title": "Hint !!!",
      "body": "Think of the number sequence: 4, 5, 6, 7..."
    }
  },
  "error": null
}

Kết thúc lesson (chốt XP, streak, mastery) — màn finish (không show trong ảnh nhưng cần)
POST /api/duo/lesson/finish

Request

{ "sessionId": "sess_abc123" }


Response

{
  "ok": true,
  "data": {
    "sessionId": "sess_abc123",
    "lessonId": "lesson-1",
    "mode": "speaking",
    "result": { "correctCount": 4, "totalCount": 5, "accuracy": 0.8, "xpEarnedTotal": 40 },
    "updated": {
      "xpTotal": 160,
      "streak": 4,
      "planetProgress": { "lessonId": "lesson-1", "completedModes": 1, "totalModes": 4 }
    }
  },
  "error": null
}