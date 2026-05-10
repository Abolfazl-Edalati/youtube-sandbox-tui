import React, { useState } from 'react';
import { isConfigured } from '../lib/config.ts';
import type { Screen } from '../types.ts';
import ConfigScreen from './ConfigScreen.tsx';
import DownloadScreen from './DownloadScreen.tsx';
import FilesScreen from './FilesScreen.tsx';
import HomeScreen from './HomeScreen.tsx';
import StatusScreen from './StatusScreen.tsx';

export default function App() {
  const [screen, setScreen] = useState<Screen>(isConfigured() ? 'home' : 'config');
  const [commitSha, setCommitSha] = useState<string>('');

  const nav = (s: Screen) => setScreen(s);

  switch (screen) {
    case 'home':
      return <HomeScreen onNav={nav} />;
    case 'config':
      return <ConfigScreen onNav={nav} />;
    case 'download':
      return (
        <DownloadScreen
          onNav={nav}
          onCommit={(sha) => {
            setCommitSha(sha);
            nav('status');
          }}
        />
      );
    case 'status':
      return <StatusScreen commitSha={commitSha} onNav={nav} />;
    case 'files':
      return <FilesScreen onNav={nav} />;
  }
}
