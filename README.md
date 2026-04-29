# 📚 NETprep - UGC NET Mock Test Application

![NETprep Banner](https://via.placeholder.com/1200x300/6366f1/ffffff?text=NETprep+-+UGC+NET+Preparation+Platform)

A comprehensive web application designed to help students prepare for UGC NET (National Eligibility Test) examinations through mock tests, practice questions, and detailed performance analytics.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Question Types](#-question-types)
- [Screenshots](#-screenshots)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## ✨ Features

### 📝 Test Management
- ✅ Create and manage mock tests
- ✅ Support for Paper 1 and Paper 2 (History)
- ✅ Custom test duration and marking schemes
- ✅ Test scheduling and activation
- ✅ Import questions from external sources

### 🎯 Question Bank
- ✅ **12+ Question Types:**
  - Multiple Choice Questions (MCQ)
  - Assertion-Reason
  - Match the Following
  - Sequence Order
  - Statement Based
  - Passage Based
  - Data Interpretation (6 types):
    - Table
    - Bar Chart
    - Pie Chart
    - Line Graph
    - Mixed Charts
    - Caselet

### 🌐 Bilingual Support
- ✅ Hindi and English language support
- ✅ Real-time translation using Google Translate API
- ✅ Question-level language switching

### 📊 Analytics & Reports
- ✅ Detailed test attempt history
- ✅ Question-wise analysis
- ✅ Topic-wise performance breakdown
- ✅ Difficulty-wise statistics
- ✅ Time management analysis
- ✅ Previous Year Question (PYQ) analysis

### 📈 Results & Performance
- ✅ Instant result generation
- ✅ Detailed solution explanations
- ✅ Performance graphs and charts
- ✅ Score comparison with previous attempts
- ✅ Export results to PDF
- ✅ Downloadable answer sheets

### 🎨 UI/UX Features
- ✅ Dark mode support
- ✅ Responsive design (Mobile, Tablet, Desktop)
- ✅ Progressive Web App (PWA) enabled
- ✅ Offline capability
- ✅ Android app support (Capacitor)

### 🔧 Admin Features
- ✅ Syllabus management for Paper 1 & Paper 2
- ✅ Bulk question import
- ✅ Question reports and moderation
- ✅ Test analytics dashboard
- ✅ Image upload (Cloudinary integration)

---

## 🛠️ Tech Stack

### Frontend
```json
{
  "framework": "React 18.2",
  "build_tool": "Vite 5.0",
  "styling": "Tailwind CSS 3.4",
  "routing": "React Router DOM 6.21",
  "state_management": "React Context API",
  "charts": "Recharts 2.10",
  "pdf_generation": "html2pdf.js 0.10",
  "icons": "Lucide React 0.309",
  "http_client": "Axios 1.6"
}
```

### Backend
```json
{
  "runtime": "Node.js 18+",
  "framework": "Express 4.18",
  "database": "MongoDB (Mongoose 8.1)",
  "file_upload": "Multer 1.4",
  "image_hosting": "Cloudinary 2.0",
  "translation": "Google Translate API",
  "cors": "CORS 2.8"
}
```

### Mobile
```json
{
  "framework": "Capacitor 5.7",
  "platforms": ["Android", "iOS (potential)"]
}
```

---

## 📁 Project Structure

```
NETprep/
├── client/                          # Frontend React Application
│   ├── public/
│   │   ├── manifest.json            # PWA manifest
│   │   ├── service-worker.js        # Service worker for PWA
│   │   └── icons/                   # App icons
│   ├── src/
│   │   ├── components/              # Reusable React components
│   │   │   ├── TestCard.jsx
│   │   │   ├── QuestionCard.jsx
│   │   │   ├── ResultChart.jsx
│   │   │   └── ...
│   │   ├── pages/                   # Page components
│   │   │   ├── Dashboard.jsx        # Main dashboard
│   │   │   ├── CreateTestPage.jsx   # Test creation
│   │   │   ├── QuestionBank.jsx     # Question management
│   │   │   ├── TestListPage.jsx     # All tests listing
│   │   │   ├── TakeTest.jsx         # Test taking interface
│   │   │   ├── Results.jsx          # Results page
│   │   │   ├── SolutionPage.jsx     # Solution viewer
│   │   │   ├── ManageSyllabus.jsx   # Syllabus management
│   │   │   ├── PYQHub.jsx           # PYQ analysis
│   │   │   ├── QuestionReports.jsx  # Question reports
│   │   │   └── Settings.jsx         # App settings
│   │   ├── context/                 # React Context
│   │   │   ├── TestContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── services/                # API services
│   │   │   ├── api.js
│   │   │   └── testService.js
│   │   ├── utils/                   # Utility functions
│   │   ├── data/                    # Static data
│   │   ├── App.jsx                  # Main App component
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Global styles
│   ├── capacitor.config.json        # Capacitor configuration
│   ├── package.json
│   └── vite.config.js               # Vite configuration
│
├── server/                          # Backend Node.js Application
│   ├── models/                      # MongoDB Models
│   │   ├── Question.js              # Question schema
│   │   ├── Test.js                  # Test schema
│   │   ├── TestAttempt.js           # Test attempt schema
│   │   ├── Syllabus.js              # Syllabus schema
│   │   ├── PYQAnalysis.js           # PYQ analysis schema
│   │   ├── QuestionReport.js        # Question report schema
│   │   ├── Passage.js               # Passage schema
│   │   ├── DIData.js                # DI data schema
│   │   └── Counter.js               # Counter schema
│   ├── routes/                      # API Routes
│   │   ├── questionRoutes.js        # Question CRUD
│   │   ├── testRoutes.js            # Test CRUD
│   │   ├── attemptRoutes.js         # Test attempts
│   │   ├── syllabusRoutes.js        # Syllabus management
│   │   ├── pyqRoutes.js             # PYQ routes
│   │   ├── reportRoutes.js          # Question reports
│   │   └── translateRoutes.js       # Translation
│   ├── config/                      # Configuration files
│   │   └── db.js                    # Database connection
│   ├── middleware/                  # Express middleware
│   │   └── upload.js                # Multer upload config
│   ├── data/                        # Seed data
│   │   ├── syllabusPaper1.json      # Paper 1 syllabus
│   │   └── syllabusPaper2History.json
│   ├── server.js                    # Main server file
│   └── package.json
│
├── package.json                     # Root package.json
├── vercel.json                      # Vercel deployment config
├── DARK_MODE_IMPLEMENTATION.md      # Dark mode docs
└── README.md                        # This file
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** >= 18.0.0
- **MongoDB** >= 6.0 (local or MongoDB Atlas)
- **npm** or **yarn**

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/netprep.git
cd netprep
```

### Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

## 🔐 Environment Setup

### Server Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/netprep
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/netprep

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS Configuration
CLIENT_URL=http://localhost:5173

# Keep-Alive (for Render/Heroku deployment)
SELF_PING_URL=http://localhost:5000
```

### Client Environment Variables

Create a `.env` file in the `client/` directory:

```env
# API URL
VITE_API_URL=http://localhost:5000/api

# Other configurations (optional)
VITE_APP_NAME=NETprep
VITE_APP_VERSION=1.0.0
```

---

## ▶️ Running the Application

### Development Mode

#### Option 1: Run Both (Recommended)
```bash
# From root directory
npm run dev
```
This will start both frontend (port 5173) and backend (port 5000) concurrently.

#### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Question Endpoints

#### Get All Questions
```http
GET /api/questions
```

**Query Parameters:**
- `paper` - Filter by paper (paper1, paper2)
- `difficulty` - Filter by difficulty (easy, medium, hard)
- `topic` - Filter by topic
- `questionType` - Filter by question type

**Response:**
```json
{
  "success": true,
  "questions": [...]
}
```

#### Create Question
```http
POST /api/questions/create
```

**Request Body:**
```json
{
  "questionType": "mcq",
  "paper": "paper1",
  "topic": "Teaching Aptitude",
  "unit": "Unit 1",
  "chapter": "Chapter 1",
  "questionText": "What is teaching?",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 0,
  "explanation": "Detailed explanation",
  "difficulty": "medium",
  "marks": 2,
  "negativeMarks": 0.5
}
```

#### Update Question
```http
PUT /api/questions/:id
```

#### Delete Question
```http
DELETE /api/questions/:id
```

#### Import Questions (Bulk)
```http
POST /api/questions/import
Content-Type: multipart/form-data
```

---

### Test Endpoints

#### Get All Tests
```http
GET /api/tests
```

#### Create Test
```http
POST /api/tests/create
```

**Request Body:**
```json
{
  "title": "Mock Test 1",
  "description": "First mock test",
  "paper": "paper1",
  "duration": 180,
  "totalQuestions": 50,
  "totalMarks": 100,
  "questions": ["questionId1", "questionId2", ...],
  "isActive": true
}
```

#### Get Test by ID
```http
GET /api/tests/:id
```

#### Update Test
```http
PUT /api/tests/:id
```

#### Delete Test
```http
DELETE /api/tests/:id
```

---

### Attempt Endpoints

#### Submit Test Attempt
```http
POST /api/attempts/submit
```

**Request Body:**
```json
{
  "testId": "testId",
  "answers": [
    {
      "questionId": "qId1",
      "selectedAnswer": 0,
      "timeTaken": 45
    }
  ],
  "timeTaken": 5400
}
```

#### Get User Attempts
```http
GET /api/attempts/user
```

#### Get Attempt by ID
```http
GET /api/attempts/:id
```

---

### Syllabus Endpoints

#### Get Syllabus
```http
GET /api/syllabus
Query: ?paper=paper1
```

#### Update Syllabus
```http
PUT /api/syllabus/:id
```

---

### Translation Endpoints

#### Translate Text
```http
POST /api/translate
```

**Request Body:**
```json
{
  "text": "Text to translate",
  "targetLang": "hi"
}
```

---

### Question Report Endpoints

#### Report Question
```http
POST /api/reports
```

**Request Body:**
```json
{
  "questionId": "qId",
  "reason": "Incorrect answer",
  "description": "Detailed description"
}
```

#### Get All Reports
```http
GET /api/reports
```

---

## 🗄️ Database Schema

### Question Schema
```javascript
{
  questionType: String,        // 'mcq', 'assertion_reason', etc.
  paper: String,               // 'paper1', 'paper2'
  topic: String,
  unit: String,
  chapter: String,
  subject: String,
  questionText: String,
  hindiQuestionText: String,
  options: [String],
  hindiOptions: [String],
  correctAnswer: Number,
  explanation: String,
  hindiExplanation: String,
  difficulty: String,          // 'easy', 'medium', 'hard'
  marks: Number,
  negativeMarks: Number,
  images: [String],            // Cloudinary URLs
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Test Schema
```javascript
{
  title: String,
  description: String,
  paper: String,
  duration: Number,            // in minutes
  totalQuestions: Number,
  totalMarks: Number,
  questions: [ObjectId],       // References to Question
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### TestAttempt Schema
```javascript
{
  testId: ObjectId,
  userId: String,              // Can be updated to ObjectId when auth is added
  answers: [{
    questionId: ObjectId,
    selectedAnswer: Number,
    isCorrect: Boolean,
    timeTaken: Number,
    markedForReview: Boolean
  }],
  score: Number,
  totalMarks: Number,
  correctCount: Number,
  incorrectCount: Number,
  unattemptedCount: Number,
  timeTaken: Number,
  startedAt: Date,
  submittedAt: Date
}
```

---

## 🎯 Question Types

### 1. Multiple Choice Questions (MCQ)
Standard 4-option questions with single correct answer.

### 2. Assertion-Reason
Two statements - Assertion (A) and Reason (R) with options:
- Both A and R are true, R is correct explanation of A
- Both A and R are true, R is NOT correct explanation of A
- A is true, R is false
- A is false, R is true

### 3. Match the Following
Match items from Column A with Column B.

### 4. Sequence Order
Arrange items in correct sequence.

### 5. Statement Based
Multiple statements with options about their correctness.

### 6. Passage Based
Questions based on a given passage.

### 7-12. Data Interpretation (DI)
- **Table**: Data in tabular format
- **Bar Chart**: Vertical/horizontal bars
- **Pie Chart**: Circular charts
- **Line Graph**: Trend lines
- **Mixed Charts**: Combination of charts
- **Caselet**: Paragraph with data

---

## 📱 Screenshots

### Dashboard
![Dashboard](https://via.placeholder.com/800x450/6366f1/ffffff?text=Dashboard)

### Test Taking Interface
![Test Interface](https://via.placeholder.com/800x450/8b5cf6/ffffff?text=Test+Interface)

### Results Page
![Results](https://via.placeholder.com/800x450/ec4899/ffffff?text=Results)

### Question Bank
![Question Bank](https://via.placeholder.com/800x450/10b981/ffffff?text=Question+Bank)

---

## 🌐 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables:
   ```
   VITE_API_URL=https://your-api.com/api
   ```
4. Deploy

### Backend (Render/Railway/Heroku)

1. Create new web service
2. Connect GitHub repository
3. Set environment variables (see Environment Setup)
4. Deploy

### MongoDB Atlas

1. Create cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user
3. Whitelist IP addresses (0.0.0.0/0 for all)
4. Get connection string
5. Update `MONGODB_URI` in `.env`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- Use ES6+ JavaScript
- Follow Airbnb style guide
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation

---

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
```
Error: MongooseServerSelectionError
```
**Solution:**
- Check if MongoDB is running locally: `mongod`
- Verify `MONGODB_URI` in `.env`
- Check network connectivity for Atlas

#### 2. CORS Error
```
Access to fetch has been blocked by CORS policy
```
**Solution:**
- Verify `CLIENT_URL` in server `.env`
- Check CORS configuration in `server.js`

#### 3. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

#### 4. Module Not Found
```
Error: Cannot find module 'package-name'
```
**Solution:**
```bash
npm install
# or
npm install package-name
```

#### 5. Cloudinary Upload Failed
**Solution:**
- Check Cloudinary credentials in `.env`
- Verify API key is active
- Check file size limits

---

## 📄 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

**NETprep Team**

- Website: [netprep.com](https://netprep.com)
- Email: support@netprep.com

---

## 🙏 Acknowledgments

- React Team for amazing framework
- MongoDB for flexible database
- Cloudinary for image hosting
- All contributors and testers

---

## 📞 Support

For support, email support@netprep.com or join our Slack channel.

---

## 🗺️ Roadmap

- [ ] User Authentication & Authorization
- [ ] Premium Subscription Plans
- [ ] AI-powered Question Recommendations
- [ ] Live Mock Tests
- [ ] Discussion Forums
- [ ] Video Solutions
- [ ] Mobile App (iOS)
- [ ] Gamification & Badges
- [ ] Leaderboards
- [ ] Study Planner

---

## 📊 Project Stats

- **Total Lines of Code:** ~15,000+
- **Components:** 50+
- **API Endpoints:** 25+
- **Database Models:** 8
- **Question Types:** 12+

---

**Made with ❤️ for UGC NET Aspirants**
