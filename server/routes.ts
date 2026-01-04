import { randomUUID } from "crypto";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { PostgresStorage } from "./postgres-storage";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow any file type for generic attachments
    cb(null, true);
  }
});

// Use PostgreSQL storage
const storage = new PostgresStorage();

export async function registerRoutes(app: Express): Promise<Server> {
  // Disable caching for API routes
  app.use('/api/*', (_req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
  });

  // Topics API
  app.get("/api/topics", async (_req, res) => {
    try {
      const topics = await storage.getTopics();
      res.json(topics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch topics" });
    }
  });

  app.post("/api/topics", async (req, res) => {
    try {
      const topic = req.body;
      await storage.saveTopic(topic);
      res.json(topic);
    } catch (error) {
      res.status(500).json({ error: "Failed to save topic" });
    }
  });

  app.put("/api/topics/:id", async (req, res) => {
    try {
      const topic = req.body;
      await storage.updateTopic(topic);
      res.json(topic);
    } catch (error) {
      res.status(500).json({ error: "Failed to update topic" });
    }
  });

  app.delete("/api/topics/:id", async (req, res) => {
    try {
      await storage.deleteTopic(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete topic" });
    }
  });

  app.post("/api/topics/:id/restore", async (req, res) => {
    try {
      await storage.restoreTopic(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to restore topic" });
    }
  });

  // Progress API
  app.get("/api/progress/:userId", async (req, res) => {
    try {
      const progress = await storage.getProgress(req.params.userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.post("/api/progress", async (req, res) => {
    try {
      const progress = req.body;
      await storage.saveProgress(progress);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to save progress" });
    }
  });

  // Users API
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Update user (e.g., avatar)
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Login API - authenticate by email
  app.post("/api/login", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: "Email is required" });
        return;
      }
      
      const user = await storage.getUserByUsername(email);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Signup API - create new user (for testing mode)
  app.post("/api/signup", async (req, res) => {
    try {
      const { name, email } = req.body;
      const role = 'employee';
      
      if (!name || !email) {
        res.status(400).json({ error: "Name and email are required" });
        return;
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(email);
      if (existingUser) {
        res.status(400).json({ error: "User with this email already exists" });
        return;
      }

      // Generate random avatar if not provided (using DiceBear)
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
      
      const newUser = {
        id: randomUUID(),
        name,
        email,
        role: role as 'admin' | 'employee',
        avatar
      };

      const createdUser = await storage.createUser(newUser);
      res.json(createdUser);
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Comments API
  app.post("/api/comments", async (req, res) => {
    try {
      const { subtopicId, comment } = req.body;
      await storage.addComment(subtopicId, comment);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save comment" });
    }
  });

  // File Upload API
  app.post("/api/upload", upload.single("file"), (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }
      
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
