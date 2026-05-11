from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, tasks, sessions, users, predict, chat

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Task Risk Prediction API",
    description="Track tasks, learn user behavior, predict deadline completion risk",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(sessions.router)
app.include_router(users.router)
app.include_router(predict.router)
app.include_router(chat.router)


@app.get("/health")
def health():
    return {"status": "ok"}
