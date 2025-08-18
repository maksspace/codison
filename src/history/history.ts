import { ProviderMessage } from '@/provider';
import * as sqlite from 'sqlite';
import { Database } from 'sqlite3';
import { v4 as uuid } from 'uuid';

export interface HistoryOptions {
  sessionId?: string;
  dbPath?: string;
}

export class History {
  private db: sqlite.Database;
  private sessionId: string;

  constructor(options?: HistoryOptions) {
    this.sessionId = options?.sessionId ?? uuid();
    this.db = null;
  }

  public async init(): Promise<void> {
    this.db = await sqlite.open({
      filename: 'history.db',
      driver: Database,
    });

    await this.db.exec(`
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
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );`);

    const sessionExists = await this.db.get(
      'SELECT id FROM sessions WHERE id = ?',
      this.sessionId,
    );

    if (!sessionExists) {
      await this.db.run(
        'INSERT INTO sessions (id, title) VALUES (?, ?)',
        this.sessionId,
        `Session ${this.sessionId}`,
      );
    }
  }

  public async addMessage(message: ProviderMessage): Promise<void> {
    const { role, type, content, ...metadata } = message as any;
    const metadataString = JSON.stringify(metadata);

    await this.db.run(
      'INSERT INTO messages (session_id, role, type, content, metadata) VALUES (?, ?, ?, ?, ?)',
      this.sessionId,
      role,
      type,
      content,
      metadataString,
    );
  }

  public async getMessages(): Promise<ProviderMessage[]> {
    const messages = await this.db.all(
      'SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC',
      this.sessionId,
    );
    return messages.map((row) => {
      const { role, type, content, metadata, ...rest } = row;
      const parsedMetadata = metadata ? JSON.parse(metadata) : {};
      return {
        role,
        type,
        content,
        ...parsedMetadata,
      } as ProviderMessage;
    });
  }

  public async clear(): Promise<void> {
    await this.db.run(
      'DELETE FROM messages WHERE session_id = ?',
      this.sessionId,
    );
  }
}
