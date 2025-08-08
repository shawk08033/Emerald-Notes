import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'notes.db');
const db = new Database(dbPath);

// Initialize database tables
export function initDatabase() {
  try {
    // Create notes table
    db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        tags TEXT,
        is_archived BOOLEAN DEFAULT 0
      )
    `);

    // Create tags table for better tag management
    db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#3B82F6'
      )
    `);

    // Create note_tags junction table
    db.exec(`
      CREATE TABLE IF NOT EXISTS note_tags (
        note_id INTEGER,
        tag_id INTEGER,
        FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE,
        PRIMARY KEY (note_id, tag_id)
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize database first
initDatabase();

// Note operations - prepared after tables are created
export const noteOperations = {
  // Create a new note
  create: db.prepare(`
    INSERT INTO notes (title, content, tags) 
    VALUES (?, ?, ?)
  `),

  // Get all notes
  getAll: db.prepare(`
    SELECT * FROM notes 
    WHERE is_archived = 0 
    ORDER BY updated_at DESC
  `),

  // Get note by ID
  getById: db.prepare(`
    SELECT * FROM notes WHERE id = ?
  `),

  // Update note
  update: db.prepare(`
    UPDATE notes 
    SET title = ?, content = ?, tags = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `),

  // Delete note
  delete: db.prepare(`
    DELETE FROM notes WHERE id = ?
  `),

  // Search notes
  search: db.prepare(`
    SELECT * FROM notes 
    WHERE (title LIKE ? OR content LIKE ?) AND is_archived = 0
    ORDER BY updated_at DESC
  `),

  // Archive note
  archive: db.prepare(`
    UPDATE notes SET is_archived = 1 WHERE id = ?
  `),

  // Unarchive note
  unarchive: db.prepare(`
    UPDATE notes SET is_archived = 0 WHERE id = ?
  `)
};

// Tag operations
export const tagOperations = {
  // Create tag
  create: db.prepare(`
    INSERT OR IGNORE INTO tags (name, color) VALUES (?, ?)
  `),

  // Get all tags
  getAll: db.prepare(`
    SELECT * FROM tags ORDER BY name
  `),

  // Get tags for a note
  getForNote: db.prepare(`
    SELECT t.* FROM tags t
    JOIN note_tags nt ON t.id = nt.tag_id
    WHERE nt.note_id = ?
  `)
};

export default db;
