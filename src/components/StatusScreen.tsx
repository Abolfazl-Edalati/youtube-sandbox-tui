import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import React, { useEffect, useState } from 'react';
import { getConfig } from '../lib/config.ts';
import { getLatestWorkflowRun } from '../lib/github.ts';
import type { AppConfig, Screen } from '../types.ts';

export default function StatusScreen({ commitSha, onNav }: { commitSha: string; onNav: (s: Screen) => void }) {
  const [status, setStatus] = useState('queued');
  const [runUrl, setRunUrl] = useState('');
  const [done, setDone] = useState(false);

  useInput((input) => {
    if ((input === 'q' || input === 'Q') && done) onNav('home');
    if ((input === 'f' || input === 'F') && done) onNav('files');
  });

  useEffect(() => {
    const poll = async () => {
      const config = getConfig() as AppConfig;
      const run = await getLatestWorkflowRun(config, commitSha);
      if (!run) return;
      setStatus(run.status === 'completed' ? (run.conclusion ?? 'completed') : (run.status ?? ''));
      setRunUrl(run.html_url);
      if (run.status === 'completed') setDone(true);
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [commitSha]);

  const statusColor = status === 'success' ? 'green' : status === 'failure' ? 'red' : 'yellow';

  return (
    <Box flexDirection='column' padding={1} gap={1}>
      <Text bold color='yellow'>
        📡 Workflow Status
      </Text>
      <Box gap={1}>
        {!done && (
          <Text color='green'>
            <Spinner type='dots' />
          </Text>
        )}
        <Text color={statusColor}>{status.toUpperCase()}</Text>
      </Box>
      {runUrl && <Text dimColor>{runUrl}</Text>}
      {done && (
        <Box flexDirection='column'>
          <Text color='green'>
            ✅ Done! Press <Text bold>F</Text> to browse files or <Text bold>Q</Text> for home.
          </Text>
        </Box>
      )}
    </Box>
  );
}
