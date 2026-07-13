# Logical Reasoning PYQ - Complete Upload & Test Guide

## 🚀 Quick Start (तेज़ तरीका)

### Option 1: NPM Command (सबसे आसान)
```bash
cd server
npm run import:lr-pyq
```

### Option 2: Direct Node
```bash
cd server
node scripts/importLogicalReasoningPYQ.js
```

### Option 3: Batch File (Windows)
```bash
# Simply double-click
server\importPYQ.bat
```

---

## ✅ क्या होता है?

जब आप import command run करते हो:

1. **📝 Questions Format** - Hindi questions को सही format में convert करता है
2. **🌐 Auto Translate** - Hindi से English में automatically translate करता है
3. **💾 Database Save** - MongoDB में save करता है
4. **✔️ Verification** - Check करता है कि सब data सही save हुआ या नहीं

---

## 📊 Output Example

```
╔════════════════════════════════════════════════════════════╗
║     Logical Reasoning PYQ Import - Auto Translate        ║
╚════════════════════════════════════════════════════════════╝

📡 Connecting to MongoDB...
✅ Connected

📝 Processing 45 questions...
✅ Formatted 45 questions

🔍 Validating import data...
✅ Validation passed

🔧 Normalizing data...
✅ Normalized: 45 questions

🌐 Auto-translating Hindi → English...
   (This may take a minute...)
✅ Translation complete:
   • Fields translated: 234
   • Direction: hi→en
   • Duration: 45234ms

💾 Saving to database...
✅ Created new record

🔎 Verifying saved data...
✅ Saved Successfully:
   • Document ID: 507f191e810c19729de860ea
   • Label: LR - Structure of Arguments
   • Total Questions: 45
   • Questions with Hindi & English: 45
   • Year: 2023
   • Session: mixed
   • Paper: Paper 1

📌 Sample Question (Q1) Verification:
   Type: statement_based
   Hindi: निम्नलिखित तर्क में किया गया/किये गए तर्कदोष...
   English: Identify the logical fallacy in the following...
   Options (HI): 4
   Options (EN): 4

╔════════════════════════════════════════════════════════════╗
║                    ✅ IMPORT SUCCESSFUL                    ║
╚════════════════════════════════════════════════════════════╝

📋 Next Steps:
   1. Use Document ID: 507f191e810c19729de860ea
   2. Create test with question IDs: pyq_507f191e810c19729de860ea_1, etc.
   3. API Endpoint: POST /api/tests
   4. Questions are now available for test creation
```

---

## 📍 Database में कहाँ Save हुआ?

### Collection: `pyqanalyses`

```javascript
{
  _id: ObjectId("507f191e810c19729de860ea"),
  displayLabel: "LR - Structure of Arguments",
  year: 2023,
  session: "mixed",
  shift: "none",
  paper: "Paper 1",
  
  // सभी 45 questions
  questionTopicMap: [
    {
      qNo: 1,
      type: "statement_based",
      questionTextHi: "निम्नलिखित तर्क में...",
      questionTextEn: "Identify the logical fallacy...",
      options: ["विकल्प 1", "विकल्प 2", ...],
      optionsHi: ["विकल्प 1", "विकल्प 2", ...],
      optionsEn: ["Option 1", "Option 2", ...],
      correctAnswer: 2,
      explanation: "उपर्युक्त तर्क में...",
      explanationHi: "उपर्युक्त तर्क में...",
      explanationEn: "In the above argument..."
    },
    // ... Q2, Q3, ... Q45
  ]
}
```

---

## 🎯 अब Test कैसे बनाएं?

### Step 1: Document ID प्राप्त करो
Output से Document ID copy करो: `507f191e810c19729de860ea`

### Step 2: API से Test बनाओ

```bash
curl -X POST http://localhost:5000/api/tests \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Logical Reasoning - Structure of Arguments",
    "testType": "full_mock_p1",
    "paper": "Paper 1",
    "duration": 120,
    "marksPerQuestion": 2,
    "negativeMarking": true,
    "negativeMarks": 0.5,
    "questions": [
      "pyq_507f191e810c19729de860ea_1",
      "pyq_507f191e810c19729de860ea_2",
      "pyq_507f191e810c19729de860ea_3",
      "pyq_507f191e810c19729de860ea_4",
      "pyq_507f191e810c19729de860ea_5"
    ]
  }'
```

### Step 3: Response में Test ID मिलेगा

```json
{
  "success": true,
  "message": "Test created with 5 questions (5 PYQ)",
  "data": {
    "_id": "607f192e810c19729de860eb",
    "title": "Logical Reasoning - Structure of Arguments",
    "totalQuestions": 5,
    "pyqCount": 5,
    "hasPYQ": true,
    "sourceType": "pyq",
    "status": "active"
  }
}
```

---

## 🧑‍💻 React/Frontend से कैसे करें?

### Import करके Test बनाना

```javascript
// 1. सबसे पहले PYQ data import करो
async function importLogicalReasoningPYQ() {
  // यह backend script से होगा
  // पर आप API से भी call कर सकते हो
}

// 2. Test बनाओ
async function createTestWithPYQ() {
  const pyqDocId = "507f191e810c19729de860ea";
  
  // कितने सवाल चाहिए?
  const selectedQuestionNos = [1, 2, 3, 4, 5];
  
  // Question IDs बनाओ
  const questionIds = selectedQuestionNos.map(
    qNo => `pyq_${pyqDocId}_${qNo}`
  );
  
  // API call करो
  const response = await fetch('/api/tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Logical Reasoning Test',
      testType: 'full_mock_p1',
      paper: 'Paper 1',
      questions: questionIds,
      duration: 120,
      marksPerQuestion: 2
    })
  });
  
  const { data } = await response.json();
  return data; // Test created!
}

// 3. Student test को attempt करे
async function attemptTest(testId) {
  const response = await fetch('/api/attempts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      testId: testId,
      userId: "current-user-id",
      answers: {
        "pyq_507f191e810c19729de860ea_1": 0, // Option 0
        "pyq_507f191e810c19729de860ea_2": 2, // Option 2
        "pyq_507f191e810c19729de860ea_3": 1  // Option 1
      }
    })
  });
  
  const { data } = await response.json();
  return data; // Attempt saved!
}
```

---

## 📱 Mobile/App से कैसे करें?

Capacitor app में same API calls करो:

```typescript
// Import करो
const response = await this.http.post('/api/tests', {
  title: 'Logical Reasoning',
  testType: 'full_mock_p1',
  paper: 'Paper 1',
  questions: ['pyq_507f191e810c19729de860ea_1', ...],
  duration: 120
}).toPromise();
```

---

## 🔍 Advanced: अपना Custom Data Upload करना

अगर आप अपना खुद का data upload करना चाहो:

### Option 1: Script को Edit करो

```javascript
// server/scripts/importLogicalReasoningPYQ.js में यह बदलो:

const QUESTIONS_DATA = [
  {
    type: "mcq",
    question: "आपका सवाल यहाँ",
    options: ["विकल्प 1", "विकल्प 2", ...],
    correct: 0,
    explanation: "समझाइश यहाँ"
  },
  // अपने सवाल add करो
];

// फिर दोबारा run करो:
// npm run import:lr-pyq
```

### Option 2: Direct API से Upload करो

```bash
curl -X POST http://localhost:5000/api/pyq/import \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2024,
    "session": "june",
    "paper": "Paper 1",
    "displayLabel": "Your Custom Label",
    "questions": [
      {
        "qNo": 1,
        "type": "mcq",
        "questionText": "Your question",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": 0
      }
    ]
  }'
```

---

## 🐛 Troubleshooting

### Issue: "MongoDB connection failed"
```
✅ Fix: सुनिश्चित करो कि:
1. MongoDB चल रहा है
2. CONNECTION_STRING सही है (.env में)
3. Internet connection है
```

### Issue: "Translation failed"
```
✅ Fix: 
1. Translation service configured है (.env में)
2. API credits available हैं
3. Internet connection है
```

### Issue: "Questions not saving"
```
✅ Fix:
1. Database में write permission है
2. Model validation pass कर रहा है
3. Duplicate entry नहीं है (script automatically replace करता है)
```

---

## 📈 Next: सवालों को Track करना

एक बार import हो जाने के बाद:

```bash
# सभी PYQ data देखो
GET /api/pyq

# Specific data देखो
GET /api/pyq/507f191e810c19729de860ea

# Stats देखो
GET /api/pyq/stats

# Tests देखो (जिनमें यह PYQ है)
GET /api/tests?hasPYQ=true
```

---

## ✨ अब तैयार हो?

1. **Run करो**: `npm run import:lr-pyq`
2. **Wait करो**: Translation के लिए 1-2 minute
3. **Copy करो**: Document ID
4. **Create करो**: Test अपने सवालों के साथ
5. **Share करो**: Students को

Happy testing! 🎯

---

**Questions?** Check the server logs or see debug output.
