# 🎵 Melomu

Melomu is a local-first music player built with [Expo](https://expo.dev) and React Native. Import your own audio files, organize them into playlists, and enjoy a polished, fully offline listening experience — no streaming account, no cloud dependency.

## Features

- **Local library** — import songs from device storage, with metadata (title, artist, album, duration) read automatically via `music-metadata`
- **Playback** — shuffle, repeat (off / one / all), queue management (reorder, add next, remove), gapless playback, and configurable crossfade
- **Library browsing** — dedicated tabs for Songs, Albums, and Artists, with batch editing and swipeable song rows for queuing
- **Playlists** — create, edit, and manage custom playlists
- **Smart Playlists** — quick access to most played, least played, recently played, and favorited tracks
- **Lyrics** — synced/plain lyrics fetched and cached locally (via LRCLIB) for offline viewing
- **Custom artwork** — add yours for song, album, artist
- **Theming** — light/dark appearance with selectable theme presets
- **Persistent storage** — songs, playlists, and lyrics are stored in a local SQLite database (`expo-sqlite`)

## Tech Stack

- [Expo](https://expo.dev) (SDK 54) + [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- React Native 0.81 / React 19
- TypeScript
- `expo-sqlite` for persistent local storage
- `expo-av` for audio playback
- `expo-media-library` / `expo-document-picker` for importing audio
- `react-native-reanimated`, `react-native-gesture-handler`, `react-native-draggable-flatlist` for UI interactions

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the app**

   ```bash
   npx expo start
   ```

   From the Expo CLI output you can open the app in:
   - a [development build](https://docs.expo.dev/develop/development-builds/introduction/)
   - an [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
   - an [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
   - [Expo Go](https://expo.dev/go) (note: some native features, like media library imports, work best in a development build)

## Project Structure

```
app/                  # File-based routes (Expo Router)
  (tabs)/              # Bottom tab screens: Home, Library, Album, Artist, Playlist, Settings
  player.tsx           # Full-screen player
  queue.tsx            # Queue view
  modal.tsx

components/           # Various components grouped by screens
  Home/                # Playlist creation/editing modals
  library/             # Songs/Albums/Artists tabs, batch edit, swipeable rows
  player/              # Playback controls, artwork, track info, lyrics modal
  settings/            # Appearance, playback, backup, import/storage sections
  ui/                  # Shared themed primitives
  AddToPlaylistModal/
  Miniplayer/          

constants/             # Core app logic
  AudioContext.tsx     # Playback engine, queue, shuffle/repeat, favorites
  Database.ts          # SQLite schema & queries
  LyricsService.ts     # Lyrics fetching/caching
  ThemeContext.tsx      # Theming
  Selectionmodecontext.tsx

assets/                # hardcoded images
scripts/reset-project.js
```

## Available Scripts

| Command                 | Description                      |
| ----------------------- | -------------------------------- |
| `npm start`             | Start the Expo dev server        |
| `npm run android`       | Run on Android                   |
| `npm run ios`           | Run on iOS                       |
| `npm run web`           | Run in a web browser             |
| `npm run lint`          | Run ESLint                       |
| `npm run reset-project` | Reset to a blank starter project |

## Notes

- Cloud backup/restore is currently disabled — it requires a custom native build and doesn't work in Expo Go.
- Lyrics are fetched from [LRCLIB](https://lrclib.net/) and cached locally for offline use.
- The images in the assets/ folder were sourced from Pinterest and do not belong to me — used for personal/demo purposes only.

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router documentation](https://docs.expo.dev/router/introduction/)
