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
      custom_artwork_path TEXT
    );
  `);

  console.log("✅ Melomu Database & Songs table initialized successfully!");
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

  await db.runAsync(
    `INSERT INTO songs (id, file_path, title, artist, album, genre, duration) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "1",
      "mock_path_1.mp3",
      "Midnight Vibes",
      "The Melomu Crew",
      "Chill Lo-Fi Vol. 1",
      "Lo-Fi",
      180,
    ],
  );

  await db.runAsync(
    `INSERT INTO songs (id, file_path, title, artist, album, genre, duration) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "2",
      "mock_path_2.mp3",
      "Neon Horizon",
      "SynthWave Boy",
      "Retro Electro",
      "Electronic",
      245,
    ],
  );

  await db.runAsync(
    `INSERT INTO songs (id, file_path, title, artist, album, genre, duration) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "3",
      "mock_path_3.mp3",
      "Acoustic Sunrise",
      "Emma Fields",
      "Unplugged Sessions",
      "Acoustic",
      155,
    ],
  );

  console.log("🎉 3 Mock songs successfully seeded into the library database!");
}
