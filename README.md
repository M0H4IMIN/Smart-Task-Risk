# Smart Task Risk Prediction System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg?logo=react)](https://react.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-000020.svg?logo=expo)](https://expo.dev/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python)](https://www.python.org/)
[![Deployed](https://img.shields.io/badge/Deployed-Live-22c55e.svg)](https://smart-task-risk.vercel.app)

> **Predict deadline risk before it predicts you.**

Smart Task Risk is an intelligent task management system that uses machine learning to analyze your behavioral patterns and predict the probability of missing deadlines — in real time, personalized to how YOU work.

---

## 🌍 Live Demo

| Service | URL |
|---------|-----|
| **Web App** | https://smart-task-risk.vercel.app |
| **API Docs** | https://smart-task-risk-backend.onrender.com/docs |
| **GitHub** | https://github.com/M0H4IMIN/Smart-Task-Risk |

> **Note:** Backend is hosted on Render's free tier — first load after inactivity may take 2-3 minutes to wake up.

---

## ✨ Features

### 🧠 ML-Powered Risk Prediction
- Random Forest Classifier trained on 2,000 synthetic behavioral samples
- 12 behavioral features including deadline pressure, session momentum, effort accuracy
- Real-time risk scores: **Low / Medium / High / Critical**
- Personalized action plans generated for each risk level

### 🤖 AI Productivity Coach
- Powered by **Groq / Llama 3.3 70B**
- Knows your actual task history, completion rates, and behavioral patterns
- Gives specific, data-driven advice — not generic productivity tips
- Available on both web and mobile

### 📊 Behavioral Analytics
- Tracks completion rate, abandon rate, effort accuracy
- Per-category performance (Coding, Studying, Editing, Writing, Design)
- Average session duration and pause frequency
- Historical task breakdown with visual charts

### ⏱ Smart Session Tracking
- Actions: **start → pause → resume → complete / abandon / decline**
- Automatic duration calculation for every session
- Momentum tracking — detects procrastination via `days_since_active`
- Live timer on mobile during active sessions

### 📱 Multi-Platform
- **Web App** — React + Vite, fully deployed on Vercel
- **Mobile App** — React Native + Expo, testable via Expo Go
- **REST API** — FastAPI with full Swagger documentation

### 🛡 Secure Authentication
- JWT-based auth with bcrypt password hashing
- User-isolated data — users only see their own tasks
- Token stored securely (SecureStore on mobile, localStorage on web)

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI, SQLAlchemy, Pydantic |
| **Database** | PostgreSQL (Supabase) |
| **ML Model** | Scikit-learn (Random Forest) |
| **AI Coach** | Groq API (Llama 3.3 70B) |
| **Web Frontend** | React 18, Vite |
| **Mobile** | React Native, Expo |
| **Auth** | python-jose (JWT), passlib (bcrypt) |
| **Deployment** | Render (backend), Vercel (frontend), Supabase (DB) |

---

## 📁 Project Structure

```
smart-task-risk/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── database.py                # DB connection and session management
│   ├── models.py                  # SQLAlchemy ORM models (4 tables)
│   ├── schemas.py                 # Pydantic request/response schemas
│   ├── auth.py                    # JWT utilities, password hashing
│   ├── stats.py                   # UserStats recalculation logic
│   ├── features.py                # ML feature extraction (12 features)
│   ├── guide.py                   # AI action plan generator
│   ├── train_model.py             # Model training script
│   ├── requirements.txt
│   └── routers/
│       ├── auth.py                # Register, login, /me
│       ├── tasks.py               # Task CRUD
│       ├── sessions.py            # Session tracking + duration calc
│       ├── users.py               # Stats endpoints
│       ├── predict.py             # ML risk prediction
│       └── chat.py                # AI coach (Groq)
├── frontend/
│   ├── src/
│   │   ├── api/client.js          # API client with token handling
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx  # Main dashboard + nav bar
│   │   │   └── StatsPage.jsx      # Analytics + charts
│   │   └── components/
│   │       ├── TaskCard.jsx       # Task card + predict button
│   │       ├── CreateTaskModal.jsx
│   │       ├── StatsPanel.jsx
│   │       └── ChatPanel.jsx      # AI coach chat UI
│   ├── package.json
│   └── vite.config.js
├── mobile/
│   ├── App.js
│   └── src/
│       ├── api/client.js
│       ├── context/AuthContext.jsx
│       ├── screens/
│       │   ├── LoginScreen.jsx
│       │   ├── DashboardScreen.jsx
│       │   ├── CreateTaskScreen.jsx
│       │   ├── TaskDetailScreen.jsx  # Live timer + session actions
│       │   ├── PredictScreen.jsx     # Risk meter + action plan
│       │   ├── StatsScreen.jsx
│       │   └── ChatScreen.jsx
│       └── components/
│           └── TaskCard.jsx
└── dataset/
    ├── synthetic_task_dataset.csv
    └── synthetic_task_dataset.pdf
```

---

## 🚀 Quick Start (Local)

### Prerequisites
- Python 3.10+
- PostgreSQL 14+
- Node.js 18+

### 1. Clone
```bash
git clone https://github.com/M0H4IMIN/Smart-Task-Risk.git
cd Smart-Task-Risk
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your DB credentials and API keys

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

### 4. Mobile Setup
```bash
cd mobile
npm install
npx expo start --web   # Test in browser
npx expo start         # Scan QR with Expo Go on your phone
```

### 5. Train ML Model
```bash
cd backend
python train_model.py
# Generates risk_model.pkl
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Get JWT token |
| GET | `/api/v1/auth/me` | Current user |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/tasks/` | Create task |
| GET | `/api/v1/tasks/` | List tasks (filterable) |
| GET | `/api/v1/tasks/{id}` | Get single task |
| PUT | `/api/v1/tasks/{id}` | Update task |
| DELETE | `/api/v1/tasks/{id}` | Delete task + sessions |

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/tasks/{id}/sessions/` | Log action (start/pause/resume/complete/abandon/decline) |
| GET | `/api/v1/tasks/{id}/sessions/` | Session history |

### Prediction & AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/predict/{id}` | Risk score + action plan |
| POST | `/api/v1/chat/` | AI coach conversation |

### Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/me/stats` | Behavioral fingerprint |
| POST | `/api/v1/users/me/stats/recalculate` | Force recalculation |

---

## 🧬 ML Model Details

### Algorithm
Random Forest Classifier with 150 estimators, max depth 8, balanced class weights.

### 12 Input Features

| Feature | Range | Description |
|---------|-------|-------------|
| priority | 1-4 | Task priority level |
| days_until_deadline | 0-30 | Days remaining |
| hours_remaining_ratio | 0-1 | Remaining / estimated work |
| deadline_pressure | 0-10 | Hours needed per day remaining |
| session_count | 0-20 | Total sessions logged |
| days_since_active | 0-15 | Inactivity / procrastination signal |
| user_completion_rate | 0-1 | Historical completion rate |
| user_abandon_rate | 0-0.6 | Historical abandon rate |
| category_completion_rate | 0-1 | Domain-specific completion rate |
| avg_pauses_per_task | 0-8 | Focus quality indicator |
| avg_effort_accuracy | 0.5-2.5 | Estimation skill (1.0 = perfect) |
| avg_session_duration | 0-120 | Average session length (minutes) |

### Risk Labels
| Score | Label |
|-------|-------|
| < 30% | 🟢 Low |
| 30-55% | 🟡 Medium |
| 55-75% | 🔴 High |
| > 75% | 🚨 Critical |

---

## ⚙ Environment Variables

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/smart-task-risk
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GROQ_API_KEY=gsk_your_groq_api_key
```

---

## 🗺 Roadmap

- [x] Web App (React)
- [x] REST API (FastAPI)
- [x] ML Risk Prediction (Scikit-learn)
- [x] AI Productivity Coach (Groq/Llama)
- [x] Mobile App (React Native + Expo)
- [x] Full Cloud Deployment
- [ ] Push Notifications (Expo Notifications)
- [ ] PWA Support (installable web app)
- [ ] Calendar Integration (Google Calendar sync)
- [ ] Team Features (shared projects)
- [ ] Real training data (retrain on actual user behavior)

---

## 👤 Author

**S.M. Mohaimin**

[![GitHub](https://img.shields.io/badge/GitHub-M0H4IMIN-181717.svg?logo=github)](https://github.com/M0H4IMIN)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built in 16 days · 3 platforms · Full Stack + ML + AI</strong><br/>
  If this project helped you, give it a ⭐️ on GitHub!
</p>
