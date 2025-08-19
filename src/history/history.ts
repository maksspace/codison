import { ProviderMessage, Usage } from '@/provider';
import Db, { Database } from 'better-sqlite3';

import { v4 as uuid } from 'uuid';

export interface HistoryOptions {
  sessionId?: string;
  dbPath?: string;
}

export interface SessionUsage {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
}

export class History {
  private db: Database;
  private sessionId: string;

  constructor(options?: HistoryOptions) {
    this.sessionId = options?.sessionId ?? uuid();
    this.db = null;
  }

  public async init(): Promise<void> {
    this.db = new Db('history.db');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        title TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        role TEXT,
        type TEXT,
        content TEXT,
        metadata TEXT,
        input_tokens INTEGER,
        output_tokens INTEGER,
        total_tokens INTEGER,
        cost REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );`);

    const sessionExists = this.db
      .prepare('SELECT id FROM sessions WHERE id = ?')
      .get(this.sessionId);

    if (!sessionExists) {
      this.db
        .prepare('INSERT INTO sessions (id, title) VALUES (?, ?)')
        .run(this.sessionId, `Session ${this.sessionId}`);
    }
  }

  public async addMessage(message: ProviderMessage): Promise<void> {
    const { role, type, content, usage, ...metadata } = message as any;
    const metadataString = JSON.stringify(metadata);

    const inputTokens = usage?.inputTokens || null;
    const outputTokens = usage?.outputTokens || null;
    const totalTokens = usage?.totalTokens || null;
    const cost = usage && usage.cost !== undefined ? usage.cost : null;

    this.db
      .prepare(
        `INSERT INTO messages (
        session_id, role, type, content, metadata, 
        input_tokens, output_tokens, total_tokens, cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        this.sessionId,
        role,
        type,
        content,
        metadataString,
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
      );
  }

  public async getMessages(): Promise<ProviderMessage[]> {
    const messages = this.db
      .prepare(
        'SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC',
      )
      .all(this.sessionId);

    return messages.map((row: any) => {
      const {
        role,
        type,
        content,
        metadata,
        input_tokens,
        output_tokens,
        total_tokens,
        cost,
        ...rest
      } = row;
      const parsedMetadata = metadata ? JSON.parse(metadata) : {};

      const usage: Usage = {
        inputTokens: input_tokens,
        outputTokens: output_tokens,
        totalTokens: total_tokens,
        cost: cost,
      };

      const messageUsage =
        input_tokens !== null || output_tokens !== null || total_tokens !== null
          ? { usage }
          : undefined;

      return {
        role,
        type,
        content,
        ...parsedMetadata,
        ...messageUsage,
      } as ProviderMessage;
    });
  }

  public async clear(): Promise<void> {
    this.db
      .prepare('DELETE FROM messages WHERE session_id = ?')
      .run(this.sessionId);
  }

  public async getUsage(sessionId: string): Promise<SessionUsage> {
    const result = this.db
      .prepare(
        `SELECT 
         SUM(input_tokens) as totalInputTokens,
         SUM(output_tokens) as totalOutputTokens,
         SUM(total_tokens) as totalTokens,
         SUM(cost) as totalCost
       FROM messages 
       WHERE session_id = ?`,
      )
      .get(sessionId) as SessionUsage;

    return {
      totalInputTokens: result.totalInputTokens || 0,
      totalOutputTokens: result.totalOutputTokens || 0,
      totalTokens: result.totalTokens || 0,
      totalCost: result.totalCost || 0,
    };
  }
}
