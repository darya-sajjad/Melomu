import { dbAsync } from "./Database";

interface LrclibTrackResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  plainLyrics: string;
  syncedLyrics: string;
}

export async function fetchAndCacheLyrics(
  songId: string,
  title: string,
  artist: string,
) {
  if (!title.trim()) return null;

  try {
    const db = await dbAsync;

    // 1. Check database storage cache to save tracking data
    const cached: any = await db.getFirstAsync(
      "SELECT * FROM lyrics_cache WHERE song_id = ?",
      [songId],
    );
    if (cached) {
      console.log(`ℹ️ Returning cached offline lyrics for: ${title}`);
      return cached;
    }

    // 2. Format search strings cleanly
    const searchQuery = encodeURIComponent(`${title} ${artist || ""}`.trim());
    const apiUrl = `https://lrclib.net/api/search?q=${searchQuery}`;

    console.log(`🌐 Hitting Fuzzy Search Endpoint: ${apiUrl}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `LRCLIB server responded with status: ${response.status}`,
      );
    }

    const searchResults: LrclibTrackResult[] = await response.json();

    if (!searchResults || searchResults.length === 0) {
      console.log(`ℹ️ No fuzzy match lyrics found on LRCLIB for: ${title}`);
      return null;
    }

    // FIX: Add bracket index [0] to extract the first matching song out of the response list!
    let bestMatch = searchResults[0];
    for (const track of searchResults.slice(0, 4)) {
      if (track.plainLyrics || track.syncedLyrics) {
        bestMatch = track;
        break;
      }
    }

    const plainTextLyrics = bestMatch.plainLyrics || "";
    const syncedLyricsText = bestMatch.syncedLyrics || "";

    if (!plainTextLyrics && !syncedLyricsText) {
      console.log(
        `ℹ️ All close matches for "${title}" are currently empty placeholders on LRCLIB.`,
      );
      return null;
    }

    // 3. Cache inside SQLite permanently
    await db.runAsync(
      `INSERT OR REPLACE INTO lyrics_cache (song_id, lyrics_text, synced_lines) VALUES (?, ?, ?)`,
      [songId, plainTextLyrics, syncedLyricsText],
    );

    console.log(
      `🎉 Lyrics successfully fetched and cached offline for: ${title}`,
    );

    return {
      song_id: songId,
      lyrics_text: plainTextLyrics,
      synced_lines: syncedLyricsText,
    };
  } catch (error) {
    console.error("❌ Lyrics Fetch Engine encountered an error:", error);
    return null;
  }
}
