# InfinityTrain - Learning Tracker

A comprehensive employee training and learning management system with progress tracking, collaborative comments, and rich resource management.

## Features

- **Topic Management**: Organize training content into topics with customizable icons
- **Subtopics & Resources**: Create detailed subtopics with markdown-based resources
- **Progress Tracking**: Track employee understanding levels (Not Addressed, Basic, Good, Fully Understood)
- **Collaborative Learning**: Add comments, images, and drawings to subtopics
- **User Roles**: Admin and employee roles with appropriate permissions
- **Persistent Storage**: SQLite database for reliable data persistence

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Radix UI
- **Backend**: Express.js, Node.js
- **Database**: SQLite (better-sqlite3) - Zero config

## Local Development

### Prerequisites

- Node.js 20.x or higher
- npm

### Setup

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd Infinitytrain3
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   
   This will start both the backend API and the Vite dev server. The application will be available at `http://localhost:5000`.

### Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run dev:client` - Start only the Vite client dev server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Run TypeScript type checking

## Database Storage

- **Local Development**: PostgreSQL
- **Configuration**: Set `DATABASE_URL` in `.env` file (e.g., `postgres://user:password@localhost:5432/infinitytrain`)


## Default Users

The application comes with pre-configured demo users:

- **Admin**: admin@oceaninfinity.com
- **Employee**: may@oceaninfinity.com
- **Employee**: adam@oceaninfinity.com
- **Employee**: chris@oceaninfinity.com
- **Employee**: arta@oceaninfinity.com
- **Employee**: enya@oceaninfinity.com

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and store
│   └── public/            # Static assets
├── server/                 # Backend Express application
│   ├── app.ts             # Express app setup
│   ├── routes.ts          # API routes
│   ├── sqlite-storage.ts  # Database layer
│   └── index-prod.ts      # Production entry point
├── render.yaml            # Render deployment config
└── package.json           # Dependencies and scripts
```

## API Endpoints

### Topics
- `GET /api/topics` - Get all topics
- `POST /api/topics` - Create a new topic
- `PUT /api/topics/:id` - Update a topic
- `DELETE /api/topics/:id` - Soft delete a topic
- `POST /api/topics/:id/restore` - Restore a deleted topic

### Progress
- `GET /api/progress/:userId` - Get user progress
- `POST /api/progress` - Save progress update

### Users
- `GET /api/users/:id` - Get user by ID

### Comments
- `POST /api/comments` - Add a comment to a subtopic



## Support & Issues

For issues, feature requests, or contributions, please open an issue in the GitHub repository.

## License

MIT
