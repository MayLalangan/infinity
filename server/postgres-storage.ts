import { Pool } from 'pg';
import { randomUUID } from 'crypto';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  avatar: string;
}

export interface Comment {
  id: string;
  userId: string;
  text?: string;
  imageUrl?: string;
  drawingUrl?: string;
  timestamp: Date;
}

export interface Subtopic {
  id: string;
  title: string;
  resources: string;
  resourceLinks?: any[];
  comments: Comment[];
}

export interface Topic {
  id: string;
  title: string;
  icon: string;
  subtopics: Subtopic[];
  isDeleted?: boolean;
}

export interface UserProgress {
  userId: string;
  subtopicId: string;
  status: 'not_addressed' | 'basic' | 'good' | 'fully_understood';
}

export interface IStorage {
  getTopics(): Promise<Topic[]>;
  saveTopic(topic: Topic): Promise<void>;
  updateTopic(topic: Topic): Promise<void>;
  deleteTopic(topicId: string): Promise<void>;
  restoreTopic(topicId: string): Promise<void>;
  addComment(subtopicId: string, comment: Comment): Promise<void>;
  getProgress(userId: string): Promise<UserProgress[]>;
  saveProgress(progress: UserProgress): Promise<void>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: User): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User | undefined>;
  initialize?(): Promise<void>;
}

export class PostgresStorage implements IStorage {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    // Create tables
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          role TEXT NOT NULL,
          avatar TEXT NOT NULL
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS topics (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          icon TEXT NOT NULL,
          isdeleted INT DEFAULT 0
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS subtopics (
          id TEXT PRIMARY KEY,
          topicid TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          resources TEXT NOT NULL,
          resourcelinks TEXT,
          sortorder INTEGER DEFAULT 0
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS comments (
          id TEXT PRIMARY KEY,
          subtopicid TEXT NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
          userid TEXT NOT NULL REFERENCES users(id),
          text TEXT,
          imageurl TEXT,
          drawingurl TEXT,
          timestamp TEXT NOT NULL
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS progress (
          userid TEXT NOT NULL REFERENCES users(id),
          subtopicid TEXT NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
          status TEXT NOT NULL,
          PRIMARY KEY (userid, subtopicid)
        );
      `);
      
      await client.query(`CREATE INDEX IF NOT EXISTS idx_subtopics_topicid ON subtopics(topicid)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_comments_subtopicid ON comments(subtopicid)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_progress_userid ON progress(userid)`);

      // Check if we need to initialize with mock data
      const userCountResult = await client.query('SELECT COUNT(*) as count FROM users');
      const userCount = parseInt(userCountResult.rows[0].count, 10);
      
      if (userCount === 0) {
        await this.initializeMockData(client);
      }
    } catch(err) {
      console.error("Error connecting to Postgres, make sure DATABASE_URL is set and valid.", err);
    } finally {
      client.release();
    }
  }

  private async initializeMockData(client: any) {
    console.log("Initializing mock data...");
    
    const mockUsers = [
      { id: 'u1', name: 'Admin', email: 'admin@oceaninfinity.com', role: 'admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin' },
      { id: 'u2', name: 'May', email: 'May-Marie.Mawili@oceaninfinity.com', role: 'employee', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=May' },
      { id: 'u3', name: 'Adam', email: 'adam.lundquist@oceaninfinity.com', role: 'employee', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Adam' },
      { id: 'u4', name: 'Chris', email: 'christoph.leitner@oceaninfinity.com', role: 'employee', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chris' },
      { id: 'u5', name: 'Arta', email: 'Arta.Zena@oceaninfinity.com', role: 'employee', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arta' },
      { id: 'u6', name: 'Enya', email: 'Enya.Tufvesson@oceaninfinity.com', role: 'employee', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Enya' },
    ];

    for (const user of mockUsers) {
      await client.query(
        'INSERT INTO users (id, name, email, role, avatar) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
        [user.id, user.name, user.email, user.role, user.avatar]
      );
    }

    const mockTopics = [
      {
        id: 't1',
        title: 'Safety First',
        icon: 'ShieldCheck',
        subtopics: [
          { id: 'st1', title: 'Emergency Procedures', resources: '# Emergency Procedures\n\nIn case of emergency...' },
          { id: 'st2', title: 'PPE Guidelines', resources: '# Personal Protective Equipment\n\nAlways wear...' },
        ]
      },
      {
        id: 't2',
        title: 'Ocean Navigation',
        icon: 'Compass',
        subtopics: [
          { id: 'st3', title: 'Chart Reading', resources: '# Reading Charts\n\nKey symbols include...' },
        ]
      },
      {
        id: 't3',
        title: 'Equipment Ops',
        icon: 'Wrench',
        subtopics: [
          { id: 'st4', title: 'ROV Maintenance', resources: '# ROV Maintenance Checklist\n\n1. Check seals...' },
        ]
      },
      {
        id: 't4',
        title: 'Data Analysis',
        icon: 'BarChart3',
        subtopics: [
          { id: 'st5', title: 'Sonar Interpretation', resources: '# Sonar Data\n\nHow to read sonar...' },
        ]
      },
      {
        id: 't5',
        title: 'Communication',
        icon: 'Radio',
        subtopics: [
          { id: 'st6', title: 'Radio Protocols', resources: '# Radio Etiquette\n\nOver and out.' },
        ]
      },
      {
        id: 't6',
        title: 'Environmental',
        icon: 'Leaf',
        subtopics: [
          { id: 'st7', title: 'Marine Life Protection', resources: '# Protecting Marine Life\n\nGuidelines...' },
        ]
      },
      {
        id: 't7',
        title: 'Vessel Maintenance',
        icon: 'Ship',
        subtopics: [
          { id: 'st8', title: 'Engine Checks', resources: '# Engine Maintenance\n\nDaily checks...' },
          { id: 'st9', title: 'Hull Inspection', resources: '# Hull Integrity\n\nRegular inspection...' },
        ]
      },
      {
        id: 't8',
        title: 'Weather Systems',
        icon: 'Wind',
        subtopics: [
          { id: 'st10', title: 'Storm Recognition', resources: '# Storm Systems\n\nIdentifying threats...' },
        ]
      },
    ];

    for (const topic of mockTopics) {
      await client.query(
        'INSERT INTO topics (id, title, icon, isdeleted) VALUES ($1, $2, $3, 0) ON CONFLICT (id) DO NOTHING',
        [topic.id, topic.title, topic.icon]
      );
      
      let sortOrder = 0;
      for (const subtopic of topic.subtopics) {
        await client.query(
          'INSERT INTO subtopics (id, topicid, title, resources, sortorder) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
          [subtopic.id, topic.id, subtopic.title, subtopic.resources, sortOrder++]
        );
      }
    }
  }

  async getTopics(): Promise<Topic[]> {
    const topicsResult = await this.pool.query('SELECT * FROM topics');
    const topics = topicsResult.rows;
    
    const result: Topic[] = [];
    for (const topic of topics) {
      const subtopicsResult = await this.pool.query(
        'SELECT * FROM subtopics WHERE topicid = $1 ORDER BY sortorder ASC',
        [topic.id]
      );
      const subtopics = subtopicsResult.rows;

      const subtopicsWithComments: Subtopic[] = [];
      for (const subtopic of subtopics) {
        const commentsResult = await this.pool.query(
          'SELECT * FROM comments WHERE subtopicid = $1 ORDER BY timestamp DESC',
          [subtopic.id]
        );
        const comments = commentsResult.rows;

        subtopicsWithComments.push({
          id: subtopic.id,
          title: subtopic.title,
          resources: subtopic.resources,
          resourceLinks: subtopic.resourcelinks ? JSON.parse(subtopic.resourcelinks) : undefined,
          comments: comments.map((c: any) => ({
            id: c.id,
            userId: c.userid,
            text: c.text,
            imageUrl: c.imageurl,
            drawingUrl: c.drawingurl,
            timestamp: new Date(c.timestamp)
          }))
        });
      }

      result.push({
        id: topic.id,
        title: topic.title,
        icon: topic.icon,
        subtopics: subtopicsWithComments,
        isDeleted: topic.isdeleted === 1 || topic.isdeleted === true
      });
    }

    return result;
  }

  async saveTopic(topic: Topic): Promise<void> {
    const topicId = topic.id || randomUUID();
    
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(`
        INSERT INTO topics (id, title, icon, isdeleted) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET title = $2, icon = $3, isdeleted = $4
      `, [topicId, topic.title, topic.icon, topic.isDeleted ? 1 : 0]);

      // Delete existing subtopics for this topic
      await client.query('DELETE FROM subtopics WHERE topicid = $1', [topicId]);

      // Insert new subtopics
      for (let i = 0; i < topic.subtopics.length; i++) {
        const subtopic = topic.subtopics[i];
        const subtopicId = subtopic.id || randomUUID();
        const resourceLinksJson = subtopic.resourceLinks ? JSON.stringify(subtopic.resourceLinks) : null;
        
        await client.query(`
          INSERT INTO subtopics (id, topicid, title, resources, resourcelinks, sortorder) 
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [subtopicId, topicId, subtopic.title, subtopic.resources, resourceLinksJson, i]);

        // Insert comments for this subtopic
        for (const comment of subtopic.comments) {
          await client.query(`
            INSERT INTO comments (id, subtopicid, userid, text, imageurl, drawingurl, timestamp) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            comment.id,
            subtopicId,
            comment.userId,
            comment.text || null,
            comment.imageUrl || null,
            comment.drawingUrl || null,
            comment.timestamp.toISOString()
          ]);
        }
      }
      
      await client.query('COMMIT');
    } catch(e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateTopic(topic: Topic): Promise<void> {
    await this.saveTopic(topic);
  }

  async deleteTopic(topicId: string): Promise<void> {
    await this.pool.query('UPDATE topics SET isdeleted = 1 WHERE id = $1', [topicId]);
  }

  async restoreTopic(topicId: string): Promise<void> {
    await this.pool.query('UPDATE topics SET isdeleted = 0 WHERE id = $1', [topicId]);
  }

  async addComment(subtopicId: string, comment: Comment): Promise<void> {
    await this.pool.query(`
      INSERT INTO comments (id, subtopicid, userid, text, imageurl, drawingurl, timestamp) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      comment.id,
      subtopicId,
      comment.userId,
      comment.text || null,
      comment.imageUrl || null,
      comment.drawingUrl || null,
      comment.timestamp.toISOString()
    ]);
  }

  async getProgress(userId: string): Promise<UserProgress[]> {
    const result = await this.pool.query(
      'SELECT * FROM progress WHERE userid = $1',
      [userId]
    );

    return result.rows.map((row: any) => ({
      userId: row.userid,
      subtopicId: row.subtopicid,
      status: row.status
    }));
  }

  async saveProgress(progress: UserProgress): Promise<void> {
    await this.pool.query(`
      INSERT INTO progress (userid, subtopicid, status) 
      VALUES ($1, $2, $3)
      ON CONFLICT (userid, subtopicid) DO UPDATE SET status = $3
    `, [progress.userId, progress.subtopicId, progress.status]);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const row = result.rows[0];
    return row ? {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      avatar: row.avatar
    } : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [username]);
    const row = result.rows[0];
    return row ? {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      avatar: row.avatar
    } : undefined;
  }

  async createUser(user: User): Promise<User> {
    await this.pool.query(`
      INSERT INTO users (id, name, email, role, avatar) 
      VALUES ($1, $2, $3, $4, $5)
    `, [user.id, user.name, user.email, user.role, user.avatar]);
    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | undefined> {
    // Dynamically build update query
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(updates.name);
    }
    if (updates.email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(updates.email);
    }
    if (updates.role !== undefined) {
      fields.push(`role = $${idx++}`);
      values.push(updates.role);
    }
    if (updates.avatar !== undefined) {
      fields.push(`avatar = $${idx++}`);
      values.push(updates.avatar);
    }

    if (fields.length === 0) return this.getUser(userId);

    values.push(userId);
    const idParam = `$${idx}`;

    await this.pool.query(`
      UPDATE users SET ${fields.join(', ')} WHERE id = ${idParam}
    `, values);

    return this.getUser(userId);
  }

  async initialize(): Promise<void> {
     return Promise.resolve();
  }
}

export const storage = new PostgresStorage();
