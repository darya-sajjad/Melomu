import * as SQLite from "expo-sqlite";

export const dbAsync = SQLite.openDatabaseAsync("melomu.db");

export async function initializeDatabase() {
  const db = await dbAsync;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY NOT NULL,
      file_path TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT,
      album TEXT,
      genre TEXT,
      duration INTEGER DEFAULT 0,
      custom_artwork_path TEXT,
      play_count INTEGER DEFAULT 0,    -- Tracks how many times a song is loaded
      last_played INTEGER DEFAULT 0,   -- Saves timestamp of the latest play
      is_favorite INTEGER DEFAULT 0    -- Binary flag for user favorites (0 = False, 1 = True)
    );
  `);

  console.log("✅ Melomu Database & Smart Tracking initialized successfully!");
}

export async function seedMockSongs() {
  const db = await dbAsync;

  const existingSongs = await db.getAllAsync("SELECT * FROM songs");
  if (existingSongs.length > 0) {
    console.log(
      `🎵 Database already seeded with ${existingSongs.length} songs.`,
    );
    return;
  }

  console.log("🎉 3 Mock songs successfully seeded into the library database!");
}
