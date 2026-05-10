[فارسی](README.fa.md) | English

# 🎬 youtube-sandbox-tui

A terminal UI for [youtube-sandbox](https://github.com/arbtech/youtube-sandbox) — trigger YouTube downloads via GitHub Actions, monitor progress, browse downloaded files, and manage your repo, all without leaving your terminal.

> [!NOTE]
> This project was built with the assistance of Claude (Anthropic). The code, structure, and documentation were generated through an AI-assisted development session and reviewed by the author.

---

## How it works

youtube-sandbox-tui is a frontend for the [youtube-sandbox](https://github.com/arbtech/youtube-sandbox) GitHub Actions workflow. That workflow watches for commits whose message starts with `yt-dlp:` and automatically downloads the linked video, storing it in the `downloads/` folder of your repo.

This TUI handles everything on your end:

- Composing and pushing the trigger commit via the GitHub API
- Monitoring the resulting Actions workflow run in real time
- Browsing, downloading, and deleting files from your repo

---

## Prerequisites

| Requirement                                                                 | Version | Notes                        |
| --------------------------------------------------------------------------- | ------- | ---------------------------- |
| [Bun](https://bun.sh)                                                       | v1.0+   | Runtime and package manager  |
| A forked [youtube-sandbox](https://github.com/arbtech/youtube-sandbox) repo | —       | Follow its setup guide first |
| A GitHub Personal Access Token                                              | —       | See below                    |

### Setting up your GitHub PAT

1. Go to **GitHub → Settings → Developer Settings → Personal Access Tokens → Fine-Grained Tokens**
2. Click **Generate new token**
3. Under **Repository access**, select **Only select repositories** and pick your forked repo
4. Grant the following permissions:

| Permission | Level                    |
| ---------- | ------------------------ |
| Contents   | Read and write           |
| Actions    | Read-only                |
| Metadata   | Read-only (auto-granted) |

5. Copy the generated token — you'll need it on first launch

---

## Installation

```bash
# Clone the repo
git clone https://github.com/amir-reza-bijandi/youtube-sandbox-tui
cd youtube-sandbox-tui

# Install dependencies
bun install

# Start the app
bun start
```

---

## First launch

On first launch (or if no config is found), the app will open the **Config screen** automatically and ask for three things:

```
GitHub Personal Access Token   →  your fine-grained PAT (input is masked)
Repo Owner                     →  the GitHub username that owns the forked repo
Repo Name                      →  the name of the forked repo (e.g. youtube-sandbox)
```

These are saved locally using [`conf`](https://github.com/sindresorhus/conf) and persist between sessions. You can update them at any time from the **Configure** option in the home menu.

---

## Usage

### Home screen

```
🎬 YouTube Sandbox TUI

  ⬇  New Download
  📁  Browse Files
  ⚙️  Configure
```

Navigate with **↑ / ↓** and confirm with **Enter**.

---

### ⬇ New Download

Walk through a short form to configure your download:

**Step 1 — URL**
Paste any YouTube URL (video or playlist) and press **Enter**.

**Step 2 — Quality**

```
  Best (default)
  1080p
  720p
  480p
```

**Step 3 — Flags**
Toggle any combination of options, then select **Continue**:

```
  ⬜ Audio only (MP3)
  ⬜ Download subtitles
  ⬜ Full playlist
```

**Step 4 — Confirm**
Review the commit message that will be pushed, then confirm to trigger the download:

```
yt-dlp: https://youtu.be/xxxxxxxxxxx quality: 1080 subtitles: true
```

After confirming, the app pushes a commit to your repo and switches automatically to the **Status screen**.

---

### 📡 Status screen

Polls the GitHub Actions API every 5 seconds and displays the current state of the triggered workflow run:

```
📡 Workflow Status

⠋ IN_PROGRESS
https://github.com/your-username/youtube-sandbox/actions/runs/...
```

Once the run completes:

```
✅ SUCCESS
Press F to browse files or Q for home.
```

| Key   | Action             |
| ----- | ------------------ |
| **F** | Go to Files screen |
| **Q** | Go back to Home    |

---

### 📁 Browse Files

Lists the contents of the `downloads/` folder in your repo. Large videos that were automatically split into `.zip` parts appear as folders — you can drill into them.

```
📁 Downloads

4 items — ↑↓ navigate · Enter download · D delete · Q home

  📁  big-video/
  📄  short-clip.mp4         (42.3 MB)
  📄  podcast-episode.mp3    (18.7 MB)
  📄  tutorial.mp4           (87.1 MB)
```

| Key         | Action                                                                   |
| ----------- | ------------------------------------------------------------------------ |
| **↑ / ↓**   | Navigate the list                                                        |
| **Enter**   | Download the selected file to `~/Downloads`, or open a folder            |
| **D**       | Delete the selected file or folder from the repo (asks for confirmation) |
| **Q / Esc** | Go up one level (inside a folder) or back to Home                        |

**Downloading** streams the file directly to `~/Downloads` with a live progress indicator:

```
⠋ Downloading...
67.3%  (57.0 MB / 87.1 MB)
```

**Deleting a folder** (split video) automatically deletes all files inside it one by one. GitHub removes the now-empty folder automatically. All delete commits include `[skip ci]` so they don't accidentally trigger a new download.

---

### ⚙️ Configure

Update your saved token, repo owner, or repo name at any time. The token field is masked on input.

---

## Project structure

```
youtube-sandbox-tui/
├── src/
│   ├── index.tsx                 # Entry point
│   ├── types.ts                  # Shared types (Screen, AppConfig, FileEntry, ...)
│   ├── lib/
│   │   ├── config.ts             # Read/write persistent config via conf
│   │   └── github.ts             # All GitHub API calls (Octokit wrapper)
│   └── components/
│       ├── App.tsx               # Screen router
│       ├── HomeScreen.tsx
│       ├── ConfigScreen.tsx
│       ├── DownloadScreen.tsx
│       ├── StatusScreen.tsx
│       └── FilesScreen.tsx
├── package.json
└── tsconfig.json
```

---

## Dependencies

| Package                                                                | Purpose                         |
| ---------------------------------------------------------------------- | ------------------------------- |
| [`ink`](https://github.com/vadimdemedes/ink)                           | React-based TUI renderer        |
| [`ink-text-input`](https://github.com/vadimdemedes/ink-text-input)     | Text input component            |
| [`ink-select-input`](https://github.com/vadimdemedes/ink-select-input) | Arrow-key selection menus       |
| [`ink-spinner`](https://github.com/vadimdemedes/ink-spinner)           | Loading spinners                |
| [`octokit`](https://github.com/octokit/octokit.js)                     | Official GitHub API SDK         |
| [`conf`](https://github.com/sindresorhus/conf)                         | Persistent local config storage |
| [`chalk`](https://github.com/chalk/chalk)                              | Terminal colors                 |

---

## Limitations & known caveats

- **GitHub repo size** — GitHub recommends keeping repos under 5 GB. Download your videos locally and delete them from the repo regularly using the Files screen.
- **Cookie expiry** — The youtube-sandbox workflow uses your YouTube cookies to bypass bot detection. These expire every 2–3 months. If downloads start failing, follow the cookie setup steps in the [youtube-sandbox README](https://github.com/arbtech/youtube-sandbox) again.
- **One link per commit** — The workflow only processes the first `yt-dlp:` link in a commit message.
- **Actions quota** — GitHub Actions has a monthly free-tier limit for private repos (2,000 minutes). Public forks are unlimited.
- **Personal use only** — Downloading copyrighted content may violate YouTube's Terms of Service and applicable law. Use responsibly and only for content you have the right to download.

---

## License

MIT

---

> **AI Disclaimer:** This project was built with the assistance of [Claude](https://claude.ai) by Anthropic. All code was reviewed, tested, and adjusted by the project author.
