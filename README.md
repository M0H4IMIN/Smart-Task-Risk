# Smart Task Risk

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg?logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python)](https://www.python.org/)

> **Predict deadline risk before it predicts you.**

Smart Task Risk is an intelligent task management system that uses machine learning to analyze your work patterns and predict the risk of missing deadlines. It doesn't just track tasks—it learns *how* you work and provides actionable insights to keep you on track.

---

## Features

### 🧠 ML-Powered Risk Prediction
- Analyzes **12 behavioral features** to calculate deadline risk
- Learns from your historical completion patterns
- Provides personalized risk scores (Low/Medium/High/Critical)

### 📊 Behavioral Analytics Dashboard
- Real-time stats on completion rates, abandon rates, and session patterns
- Category-wise performance tracking (Coding, Studying, Editing, Writing, Design)
- Effort accuracy measurement to improve your estimates

### 🎯 Smart Session Tracking
- Track work sessions with automatic duration calculation
- Support for pause/resume/complete/abandon workflows
- Momentum tracking to detect procrastination patterns

### 💡 AI-Generated Action Plans
- Context-aware recommendations based on your risk level
- Category-specific tips (e.g., "Break into functions" for coding tasks)
- Deadline pressure warnings with concrete next steps

### 🔐 Secure Authentication
- JWT-based authentication with bcrypt password hashing
- User-isolated data with ownership enforcement
- Session management with secure token refresh

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI, SQLAlchemy, Scikit-learn |
| **Database** | PostgreSQL |
| **Frontend** | React 18, Vite |
| **Auth** | python-jose (JWT), passlib (bcrypt) |
| **ML Model** | Random Forest Classifier (12 features) |

---

## Project Structure

```
smart-task-risk/
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── routers/
│   │   ├── auth.py             # Register, login, user endpoints
│   │   ├── tasks.py            # CRUD operations for tasks
│   │   ├── sessions.py         # Session tracking logic
│   │   ├── users.py            # User stats and profile
│   │   └── predict.py          # ML risk prediction endpoint
│   ├── models.py               # SQLAlchemy ORM models
│   ├── schemas.py              # Pydantic validation schemas
│   ├── auth.py                 # Password hashing, JWT utilities
│   ├── database.py             # DB connection and session management
│   ├── features.py             # Feature extraction for ML
│   ├── guide.py                # AI recommendation generator
│   ├── stats.py                # User stats calculation
│   ├── train_model.py          # Model training script
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx   # Authentication UI
│   │   │   └── DashboardPage.jsx  # Main task dashboard
│   │   ├── components/
│   │   │   ├── TaskCard.jsx
│   │   │   ├── CreateTaskModal.jsx
│   │   │   └── StatsPanel.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Auth state management
│   │   ├── api/
│   │   │   └── client.js        # API client with token handling
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── dataset/
│   └── synthetic_task_dataset.csv  # Training data
├── .gitignore
└── README.md
```

---

## Quick Start

### Prerequisites

- Python 3.10+
- PostgreSQL 14+
- Node.js 18+

### 1. Clone the Repository

```bash
git clone https://github.com/M0H4IMIN/Smart-Task-Risk.git
cd Smart-Task-Risk
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
python -c "from database import engine, Base; Base.metadata.create_all(bind=engine)"

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Train the ML Model (Optional)

```bash
cd backend
python train_model.py
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Create new account |
| `POST` | `/api/v1/auth/login` | Get JWT token |
| `GET` | `/api/v1/auth/me` | Get current user |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/tasks/` | Create task |
| `GET` | `/api/v1/tasks/` | List all tasks (filterable) |
| `GET` | `/api/v1/tasks/{id}` | Get single task |
| `PUT` | `/api/v1/tasks/{id}` | Update task |
| `DELETE` | `/api/v1/tasks/{id}` | Delete task |

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/tasks/{id}/sessions/` | Log session action |
| `GET` | `/api/v1/tasks/{id}/sessions/` | Get session history |

### Prediction
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/predict/{task_id}` | Get risk prediction |

### User Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/users/me/stats` | Get behavioral stats |
| `POST` | `/api/v1/users/me/stats/recalculate` | Force stats recalculation |

---

## ML Model Details

### Features Used for Prediction

1. **Task Priority** (1-4 scale)
2. **Days Until Deadline**
3. **Hours Remaining Ratio**
4. **Deadline Pressure** (hours needed / days left)
5. **Session Count** (number of work sessions)
6. **Days Since Active** (procrastination indicator)
7. **User Completion Rate** (historical)
8. **User Abandon Rate** (historical)
9. **Category Completion Rate** (domain-specific)
10. **Avg Pauses Per Task** (focus indicator)
11. **Avg Effort Accuracy** (estimation skill)
12. **Avg Session Duration** (work pattern)

### Risk Labels

| Score Range | Label |
|-------------|-------|
| < 30% | Low |
| 30-55% | Medium |
| 55-75% | High |
| > 75% | Critical |

---

## Environment Variables

Create a `backend/.env` file:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/smart-task-risk
SECRET_KEY=your-secret-key-here-use-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

> ⚠️ **Never commit `.env` to version control.** The file is gitignored by default.

---

## Development

### Running Tests

```bash
cd backend
pytest
```

### Code Style

```bash
# Backend
black backend/
flake8 backend/

# Frontend
npm run lint
```

---

## Roadmap

- [ ] **Mobile App** - React Native client (coming soon)
- [ ] **Browser Extension** - Quick task capture from any webpage
- [ ] **Team Features** - Shared projects and collaboration
- [ ] **Calendar Integration** - Google Calendar, Outlook sync
- [ ] **Notifications** - Push alerts for high-risk tasks
- [ ] **Advanced ML** - Neural network model with temporal patterns

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Author

**S.M. Mohaimin**

[![GitHub](https://img.shields.io/badge/GitHub-M0H4IMIN-181717.svg?logo=github)](https://github.com/M0H4IMIN)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Mohaimin-0077B5.svg?logo=linkedin)](https://linkedin.com/in/mohaimin)

---

## Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- UI powered by [React](https://react.dev/) - Library for user interfaces
- ML powered by [Scikit-learn](https://scikit-learn.org/) - Machine learning library

---

<p align="center">
  <strong>If this project helps you, please give it a ⭐️ on GitHub!</strong>
</p>
