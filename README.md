# GrantKit (TypeScript) — Grant Application Information Manager

This is a small, open-source product to help charities manage reusable grant application information.

## Windows-only Setup

### 0) Prereqs
- Node.js 20+ recommended

### 1) Create projects
```Command Prompt as Admin
mkdir 51a7db-tfg-hack-grant-application-react
cd 51a7db-tfg-hack-grant-application-react
npm init -y

mkdir apps
mkdir apps\web

cd apps
npm create vite@latest web -- --template react-ts
cd web
npm install
```

### 2) Install + run
From repo root: 51a7db-tfg-hack-grant-application-react
```Command Prompt as Admin
npm install
npm run dev
```

- Web: http://localhost:5173

## Data location
- `apps/api/data/db.json`
- Backup/Restore available in UI
