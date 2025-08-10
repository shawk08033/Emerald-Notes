import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'notes.db');
const db = new Database(dbPath);

// Initialize database tables
export function initDatabase() {
  try {
    // Create folders table
    db.exec(`
      CREATE TABLE IF NOT EXISTS folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER,
        icon TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES folders (id) ON DELETE CASCADE
      )
    `);

    // Create notes table
    db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        folder_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        tags TEXT,
        is_archived BOOLEAN DEFAULT 0,
        FOREIGN KEY (folder_id) REFERENCES folders (id) ON DELETE SET NULL
      )
    `);

    // Add folder_id column to existing notes table if it doesn't exist
    try {
      db.exec(`ALTER TABLE notes ADD COLUMN folder_id INTEGER REFERENCES folders (id) ON DELETE SET NULL`);
    } catch (error) {
      // Column already exists, ignore error
      console.log('folder_id column already exists or migration not needed');
    }

    // Add icon column to existing folders table if it doesn't exist
    try {
      db.exec(`ALTER TABLE folders ADD COLUMN icon TEXT`);
    } catch (error) {
      // Column already exists, ignore error
      console.log('icon column already exists or migration not needed');
    }

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

    // Create images table to store binary image data separately
    db.exec(`
      CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT,
        mime TEXT NOT NULL,
        data BLOB NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    INSERT INTO notes (title, content, tags, folder_id) 
    VALUES (?, ?, ?, ?)
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
    SET title = ?, content = ?, tags = ?, folder_id = ?, updated_at = CURRENT_TIMESTAMP 
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
  `),

  // Get notes by tag
  getNotesByTag: db.prepare(`
    SELECT DISTINCT n.* FROM notes n
    JOIN note_tags nt ON n.id = nt.note_id
    JOIN tags t ON nt.tag_id = t.id
    WHERE t.name = ? AND n.is_archived = 0
    ORDER BY n.updated_at DESC
  `),

  // Get notes by tag name (using the old tags field for backward compatibility)
  getNotesByTagName: db.prepare(`
    SELECT * FROM notes 
    WHERE tags LIKE ? AND is_archived = 0
    ORDER BY updated_at DESC
  `),


};

// Folder operations
export const folderOperations = {
  // Create a new folder
  create: db.prepare(`
    INSERT INTO folders (name, parent_id, icon) 
    VALUES (?, ?, ?)
  `),

  // Get all folders
  getAll: db.prepare(`
    SELECT * FROM folders ORDER BY name
  `),

  // Get folder by ID
  getById: db.prepare(`
    SELECT * FROM folders WHERE id = ?
  `),

  // Get folders by parent ID (for nested folders)
  getByParent: db.prepare(`
    SELECT * FROM folders WHERE parent_id = ? ORDER BY name
  `),

  // Update folder
  update: db.prepare(`
    UPDATE folders 
    SET name = ?, parent_id = ?, icon = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `),

  // Delete folder
  delete: db.prepare(`
    DELETE FROM folders WHERE id = ?
  `),

  // Get notes in a folder
  getNotesInFolder: db.prepare(`
    SELECT * FROM notes 
    WHERE folder_id = ? AND is_archived = 0 
    ORDER BY updated_at DESC
  `)
};

export default db;

// Image operations
export const imageOperations = {
  create: db.prepare(`
    INSERT INTO images (filename, mime, data) VALUES (?, ?, ?)
  `),
  getById: db.prepare(`
    SELECT id, filename, mime, data FROM images WHERE id = ?
  `),
  delete: db.prepare(`
    DELETE FROM images WHERE id = ?
  `),
};
