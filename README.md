# Exam Backend

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file with your credentials (see `.env.example`)

3. Run the server:
```bash
npm start
```

## Deploy to Render

1. Create a new **Web Service** on Render
2. Connect your GitHub repository
3. Set **Root Directory** to `backend`
4. Set **Build Command** to `npm install`
5. Set **Start Command** to `npm start`
6. Add all environment variables from `.env`

## API Endpoints

### Student
- `GET /api/check-attempt?rollNumber=&department=&section=` - Check duplicate attempt
- `GET /api/questions?department=&section=` - Get questions
- `POST /api/submit-exam` - Submit exam

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/questions` - Get all questions
- `POST /api/admin/questions` - Add question
- `DELETE /api/admin/questions/:id` - Delete question
- `GET /api/admin/responses` - Get responses (with duplicate detection)
- `DELETE /api/admin/responses/:id` - Delete response
- `DELETE /api/admin/responses/by-date/:date` - Delete by date