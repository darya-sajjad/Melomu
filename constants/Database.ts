import * as SQLite from "expo-sqlite";

export const dbAsync = SQLite.openDatabaseAsync("melomu.db");

let isDbInitialized = false;

export async function initializeDatabase() {
  if (isDbInitialized) return;

  const db = await dbAsync;

  await db.execAsync("PRAGMA foreign_keys = ON;");

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY NOT NULL,
      file_path TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT,
      album TEXT,
      duration INTEGER DEFAULT 0,
      custom_artwork_path TEXT,
      artwork_source TEXT DEFAULT 'album',
      play_count INTEGER DEFAULT 0,
      last_played INTEGER DEFAULT 0,
      is_favorite INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS album_artworks (
      album TEXT PRIMARY KEY NOT NULL,
      artwork_path TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lyrics_cache (
      song_id TEXT PRIMARY KEY NOT NULL,
      lyrics_text TEXT,               
      synced_lines TEXT,               
      FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      artwork_path TEXT,
      created_at INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS playlist_songs (
      playlist_id TEXT NOT NULL,
      song_id TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      PRIMARY KEY (playlist_id, song_id),
      FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE
    );
  `);

  try {
    await db.execAsync(
      `ALTER TABLE songs ADD COLUMN artwork_source TEXT DEFAULT 'album';`,
    );
  } catch {
    // Column already exists — safe to ignore
  }

  isDbInitialized = true;
  console.log("✅ Melomu Persistent Database completely active and locked!");
}

export async function seedMockSongs() {
  console.log("ℹ️ Dynamic User Collection Active. Skipping template seeding.");
}
