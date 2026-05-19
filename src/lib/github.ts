import * as fs from 'fs';
import { Octokit } from 'octokit';
import type { AppConfig, DownloadOptions } from '../types.ts';

export function buildCommitMessage(opts: DownloadOptions): string {
  let msg = `yt-dlp: ${opts.url}`;
  if (opts.quality && opts.quality !== 'best') msg += ` quality: ${opts.quality}`;
  if (opts.audioOnly) msg += ` audio-only: true`;
  if (opts.subtitles) msg += ` subtitles: true`;
  if (opts.playlist) msg += ` playlist: true`;
  if (opts.sponsorblock === false) msg += ` sponsorblock: false`;
  return msg;
}

export async function triggerDownload(config: AppConfig, opts: DownloadOptions): Promise<string> {
  const octokit = new Octokit({ auth: config.token });
  const { owner, repo } = config;

  // Get the current file (we'll update README.md as a dummy trigger)
  const { data: fileData } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path: 'README.md',
  });

  if (Array.isArray(fileData) || fileData.type !== 'file') {
    throw new Error('Unexpected response for README.md');
  }

  const commitMessage = buildCommitMessage(opts);

  const { data: commitData } = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: 'README.md',
    message: commitMessage,
    content: fileData.content, // same content, no actual change
    sha: fileData.sha,
  });

  return commitData.commit.sha!;
}

export async function getLatestWorkflowRun(config: AppConfig, commitSha: string) {
  const octokit = new Octokit({ auth: config.token });
  const { data } = await octokit.rest.actions.listWorkflowRunsForRepo({
    owner: config.owner,
    repo: config.repo,
    per_page: 5,
  });

  return data.workflow_runs.find((run) => run.head_sha === commitSha) ?? null;
}

// Update the existing listDownloads function signature:
export async function listDownloads(config: AppConfig, subPath = 'downloads') {
  const octokit = new Octokit({ auth: config.token });

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: subPath,
    });

    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

export async function deleteFile(config: AppConfig, filePath: string, sha: string): Promise<void> {
  const octokit = new Octokit({ auth: config.token });

  await octokit.rest.repos.deleteFile({
    owner: config.owner,
    repo: config.repo,
    path: filePath,
    message: `Remove ${filePath.split('/').pop()} [skip ci]`,
    sha,
  });
}

export async function downloadFileViaApi(
  config: AppConfig,
  sha: string,
  savePath: string,
  onProgress: (received: number, total: number) => void,
): Promise<void> {
  const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/git/blobs/${sha}`, {
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github.raw',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);

  const contentLength = Number(response.headers.get('content-length') ?? 0);
  const reader = response.body!.getReader();
  const fileStream = fs.createWriteStream(savePath);
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fileStream.write(value);
    received += value.byteLength;
    onProgress(received, contentLength);
  }

  await new Promise<void>((res, rej) => {
    fileStream.end((err?: Error | null) => (err ? rej(err) : res()));
  });
}
