import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import React from 'react';
import type { Screen } from '../types.ts';

const items = [
  { label: '⬇  New Download', value: 'download' },
  { label: '📁  Browse Files', value: 'files' },
  { label: '⚙️  Configure', value: 'config' },
];

export default function HomeScreen({ onNav }: { onNav: (s: Screen) => void }) {
  return (
    <Box flexDirection='column' padding={1} gap={1}>
      <Text bold color='yellow'>
        🎬 YouTube Sandbox TUI
      </Text>
      <SelectInput items={items} onSelect={(item) => onNav(item.value as Screen)} />
    </Box>
  );
}
