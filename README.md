# Ocean Infinity Training - Employee Development Portal

A modern, high-fidelity training management system designed to track employee progress, facilitate learning through structured resources, and encourage reflection via a rich personal notepad.

## 🚀 Key Features

### 🎓 Learning Management
- **Infinity Grid Navigation**: Unique, engaging home interface for exploring training topics.
- **Topic & Subtopic View**: Structured breakdown of learning modules with progress tracking.
- **Progress Tracking**: Self-assessment levels (**Not Addressed**, **Basic**, **Good**, **Fully Understood**) with visual cues.
- **Resource Viewer**: Centralized hub for videos, PDF docs, and external links, featuring rich metadata and inline video playback.

### 📝 Personal Notepad
A powerful reflection tool integrated into every subtopic:
- **Private & Secure**: Notes are visible only to the learner.
- **Rich Interaction**: 
  - **Lined/Blank Paper Mode**: Toggleable writing surface for comfort.
  - **Drawing Tools**: Integrated sketching canvas (Pencil, Highlighter, Eraser) for diagrams and evacuation routes.
  - **Attachments**: Drag-and-drop support for images and PDFs.
- **Auto-Save**: Real-time saving with status feedback ("Saved just now").
- **Smart Prompts**: Contextual scaffolding questions (e.g., "What steps should you remember?") to guide reflection.

### 👥 User Roles & Administration
- **Employee View**: Focus on personal progress, learning resources, and notes.
- **Admin View**: Manage topics, subtopics, and view team progress.

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Shadcn UI, Framer Motion
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (via `pg`) / SQLite (fallback)
- **Icons**: Lucide React

## 📦 Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── infinity-grid.tsx    # Core navigation component
│   │   │   ├── notepad.tsx          # Rich text & drawing editor
│   │   │   ├── resource-viewer.tsx  # Media & link viewer
│   │   │   └── ui/                  # Shadcn UI primitives
│   │   ├── pages/                   # Route components (Topic, Home)
│   │   └── lib/                     # State management (store.ts)
├── server/
│   ├── routes.ts                    # API Route definitions
│   └── postgres-storage.ts          # Database adapter
└── uploads/                         # User-uploaded content
```

## 🚀 Local Development

1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd Infinitytrain3
   npm install
   ```

2. **Database Setup**
   Ensure PostgreSQL is running and update `.env` with your `DATABASE_URL`.
   ```bash
   # Example .env
   DATABASE_URL=postgres://user:pass@localhost:5432/infinitytrain
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:5000`.

## 🧪 Demo Accounts

- **Admin**: `admin@oceaninfinity.com`
- **Employees**: `may@oceaninfinity.com`, `adam@oceaninfinity.com`
  (Use the **"View As"** feature in the user dropdown to simulate different roles)

