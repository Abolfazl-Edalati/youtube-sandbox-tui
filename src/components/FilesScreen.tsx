import { Box, Text, useInput } from "ink";
import SelectInput from "ink-select-input";
import Spinner from "ink-spinner";
import * as os from "os";
import * as path from "path";
import React, { useEffect, useState } from "react";
import { getConfig } from "../lib/config.ts";
import { deleteFile, downloadBlob, listDownloads } from "../lib/github.ts";
import type { FileEntry, Screen } from "../types.ts";

type ViewState =
  | "loading"
  | "list"
  | "confirm"
  | "downloading"
  | "downloading-all" // new
  | "deleting"
  | "done"
  | "error"
  | "empty";

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

// ── Custom navigable list ─────────────────────────────────────────────────
function FileList({
  items,
  onEnter,
  onDelete,
  onDownloadAll,
}: {
  items: { label: string; value: string }[];
  onEnter: (value: string) => void;
  onDelete: (value: string) => void;
  onDownloadAll: (value: string) => void; // new
}) {
  const [index, setIndex] = useState(0);
  const clampedIndex = Math.min(index, items.length - 1);

  useInput((input, key) => {
    if (key.upArrow) {
      setIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow) {
      setIndex((i) => Math.min(items.length - 1, i + 1));
      return;
    }
    if (items[clampedIndex]) {
      if (key.return) {
        onEnter(items[clampedIndex].value);
        return;
      }
      if (input === "d" || input === "D") {
        onDelete(items[clampedIndex].value);
        return;
      }
      if (input === "a" || input === "A") {
        onDownloadAll(items[clampedIndex].value);
        return;
      }
    }
  });

  return (
    <Box flexDirection="column">
      {items.map((item, i) => (
        <Box key={item.value} gap={1}>
          <Text color={i === clampedIndex ? "cyan" : undefined}>
            {i === clampedIndex ? "›" : " "} {item.label}
          </Text>
        </Box>
      ))}
    </Box>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────
export default function FilesScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [view, setView] = useState<ViewState>("loading");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [folder, setFolder] = useState<string | null>(null);
  const [selected, setSelected] = useState<FileEntry | null>(null);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState("");
  const [batchStatus, setBatchStatus] = useState({
    current: 0,
    total: 0,
    name: "",
  });
  const [error, setError] = useState("");

  useInput((input, key) => {
    if (
      view === "downloading" ||
      view === "downloading-all" ||
      view === "deleting"
    )
      return;
    if (key.escape || input === "q" || input === "Q") {
      if (view === "confirm") {
        setView("list");
        return;
      }
      if (folder !== null) {
        setFolder(null);
        return;
      }
      onNav("home");
    }
  });

  useEffect(() => {
    load(folder);
  }, [folder]);

  async function load(subPath: string | null) {
    setView("loading");
    setFiles([]);
    const config = getConfig() as any;
    const entries = await listDownloads(config, subPath ?? undefined);
    if (entries.length === 0) {
      setView("empty");
      return;
    }
    setFiles(entries as FileEntry[]);
    setView("list");
  }

  // Enter → download file or drill into folder
  function handleEnter(value: string) {
    if (value === "__back__") {
      setFolder(null);
      return;
    }
    const entry = files.find((f) => f.path === value);
    if (!entry) return;
    if (entry.type === "dir") {
      setFolder(entry.path);
      return;
    }
    downloadFile(entry);
  }
  // D → confirm then delete
  function handleDelete(value: string) {
    if (value === "__back__") return;
    const entry = files.find((f) => f.path === value);
    if (!entry) return;
    setSelected(entry);
    setView("confirm");
  }

  // A → download all files in a directory (or single file if cursor is on one)
  async function handleDownloadAll(value: string) {
    if (value === "__back__") return;
    const entry = files.find((f) => f.path === value);
    if (!entry) return;

    if (entry.type === "file") {
      // A on a file behaves like Enter
      downloadFile(entry);
      return;
    }

    await downloadDirectory(entry);
  }

  async function downloadDirectory(dir: FileEntry) {
    setView("downloading-all");
    const config = getConfig() as any;

    try {
      const children = (
        (await listDownloads(config, dir.path)) as FileEntry[]
      ).filter((f) => f.type === "file");

      if (children.length === 0) {
        setMessage(`No files found in ${dir.name}/`);
        setView("done");
        return;
      }

      setBatchStatus({ current: 0, total: children.length, name: "" });

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child) {
          setBatchStatus({
            current: i + 1,
            total: children.length,
            name: child.name,
          });
          setProgress(`Fetching ${child.name}...`);
          await downloadFile(child, /* silent */ true);
        }
      }

      setMessage(
        `Downloaded ${children.length} file${children.length !== 1 ? "s" : ""} from ${dir.name}/ to ~/Downloads`,
      );
      setView("done");
      setTimeout(() => load(folder), 1200);
    } catch (e: any) {
      setError(e.message);
      setView("error");
    }
  }

  async function downloadFile(entry: FileEntry, silent = false) {
    if (!entry.sha) {
      setError("Missing file SHA, cannot download via API.");
      setView("error");
      return;
    }

    if (!silent) {
      setView("downloading");
      setProgress("Connecting to GitHub API...");
    }

    try {
      const config = getConfig() as any;
      const savePath = path.join(os.homedir(), "Downloads", entry.name);

      await downloadBlob(
        config,
        entry.sha,
        savePath,
        entry.size,
        (received, total) => {
          setProgress(
            total > 0
              ? `${((received / total) * 100).toFixed(1)}%  (${formatSize(received)} / ${formatSize(total)})`
              : `Downloaded ${formatSize(received)}...`,
          );
        },
      );

      if (!silent) {
        setMessage(`Saved to ${savePath}`);
        setSelected(null);
        setView("done");
        setTimeout(() => load(folder), 1200);
      }
    } catch (e: any) {
      setError(e.message);
      setView("error");
    }
  }

  async function doDelete(entry: FileEntry) {
    setView("deleting");
    const config = getConfig() as any;

    try {
      if (entry.type === "file") {
        setProgress(`Deleting ${entry.name}...`);
        await deleteFile(config, entry.path, entry.sha);
      } else {
        setProgress(`Listing files in ${entry.name}/...`);
        const children = (await listDownloads(
          config,
          entry.path,
        )) as FileEntry[];
        for (const child of children) {
          if (child.type === "file") {
            setProgress(`Deleting ${child.name}...`);
            await deleteFile(config, child.path, child.sha);
          }
        }
      }

      setMessage(`Deleted ${entry.name}`);
      setSelected(null);
      setView("done");
      setTimeout(() => load(folder), 1200);
    } catch (e: any) {
      setError(e.message);
      setView("error");
    }
  }
  const confirmItems = [
    { label: "Yes, delete it", value: "go" },
    { label: "No, go back", value: "cancel" },
  ];

  async function handleConfirm(item: { value: string }) {
    if (item.value === "cancel") {
      setSelected(null);
      setView("list");
      return;
    }
    await doDelete(selected!);
  }

  const listItems = [
    ...(folder !== null ? [{ label: "← Back", value: "__back__" }] : []),
    ...files.map((f) => ({
      label:
        f.type === "dir"
          ? `📁  ${f.name}/`
          : `📄  ${f.name}  ${f.size > 0 ? `(${formatSize(f.size)})` : ""}`,
      value: f.path,
    })),
  ];

  return (
    <Box flexDirection="column" padding={1} gap={1}>
      <Box gap={2}>
        <Text bold color="yellow">
          📁 Downloads
        </Text>
        {folder && <Text dimColor>/ {folder.replace("downloads/", "")}</Text>}
      </Box>

      {view === "loading" && (
        <Box gap={1}>
          <Text color="green">
            <Spinner type="dots" />
          </Text>
          <Text>Fetching file list...</Text>
        </Box>
      )}

      {view === "empty" && (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>No files found in downloads/ yet.</Text>
          <Text dimColor>Trigger a download first, then come back.</Text>
        </Box>
      )}

      {view === "list" && (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>
            {files.length} item{files.length !== 1 ? "s" : ""} — ↑↓ navigate ·
            Enter download · A download dir · D delete · Q{" "}
            {folder ? "back" : "home"}
          </Text>
          <FileList
            items={listItems}
            onEnter={handleEnter}
            onDelete={handleDelete}
            onDownloadAll={handleDownloadAll}
          />
        </Box>
      )}

      {view === "confirm" && selected && (
        <Box flexDirection="column" gap={1}>
          <Text color="red">
            ⚠️ Delete <Text bold>{selected.name}</Text> from the repo?
          </Text>
          <Text dimColor>This cannot be undone.</Text>
          <SelectInput items={confirmItems} onSelect={handleConfirm} />
        </Box>
      )}

      {view === "downloading" && (
        <Box flexDirection="column" gap={1}>
          <Box gap={1}>
            <Text color="green">
              <Spinner type="dots" />
            </Text>
            <Text>Downloading...</Text>
          </Box>
          <Text color="cyan">{progress}</Text>
        </Box>
      )}

      {view === "downloading-all" && (
        <Box flexDirection="column" gap={1}>
          <Box gap={1}>
            <Text color="green">
              <Spinner type="dots" />
            </Text>
            <Text>
              Downloading file{" "}
              <Text bold color="cyan">
                {batchStatus.current}/{batchStatus.total}
              </Text>
              {"  "}
              {batchStatus.name}
            </Text>
          </Box>
          <Text dimColor>{progress}</Text>
        </Box>
      )}
      {view === "deleting" && (
        <Box flexDirection="column" gap={1}>
          <Box gap={1}>
            <Text color="red">
              <Spinner type="dots" />
            </Text>
            <Text>Deleting...</Text>
          </Box>
          <Text dimColor>{progress}</Text>
        </Box>
      )}

      {view === "done" && <Text color="green">✅ {message}</Text>}

      {view === "error" && (
        <Box flexDirection="column" gap={1}>
          <Text color="red">❌ {error}</Text>
          <Text dimColor>Press Q to go back.</Text>
        </Box>
      )}
    </Box>
  );
}
