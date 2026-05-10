import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import React, { useState } from 'react';
import { getConfig, saveConfig } from '../lib/config.ts';
import type { AppConfig, Screen } from '../types.ts';

type Field = 'token' | 'owner' | 'repo' | 'done';

export default function ConfigScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const existing = getConfig();

  const [field, setField] = useState<Field>('token');
  const [token, setToken] = useState(existing.token ?? '');
  const [owner, setOwner] = useState(existing.owner ?? '');
  const [repo, setRepo] = useState(existing.repo ?? '');

  const handleSubmit = (f: Field) => (val: string) => {
    switch (f) {
      case 'token':
        setToken(val);
        setField('owner');
        break;
      case 'owner':
        setOwner(val);
        setField('repo');
        break;
      case 'repo': {
        setRepo(val);
        saveConfig({ token, owner, repo: val } as AppConfig);
        setField('done');
        setTimeout(() => onNav('home'), 1000);
        break;
      }
    }
  };

  const fields: { key: Field; label: string; value: string; setter: (v: string) => void; secret?: boolean }[] = [
    { key: 'token', label: 'GitHub Personal Access Token', value: token, setter: setToken, secret: true },
    { key: 'owner', label: 'Repo Owner (username)', value: owner, setter: setOwner },
    { key: 'repo', label: 'Repo Name', value: repo, setter: setRepo },
  ];

  return (
    <Box flexDirection='column' padding={1} gap={1}>
      <Text bold color='yellow'>
        ⚙️ Configuration
      </Text>
      <Text dimColor>Configure your GitHub repo. Values are saved locally.</Text>

      {fields.map(({ key, label, value, setter, secret }) => {
        const isActive = field === key;
        const isDone = fields.findIndex((f) => f.key === key) < fields.findIndex((f) => f.key === field);

        return (
          <Box key={key} flexDirection='column'>
            <Text color={isActive ? 'cyan' : isDone ? 'green' : 'gray'}>
              {isDone ? '✅' : isActive ? '›' : ' '} {label}
            </Text>

            {isActive && (
              <Box marginLeft={2}>
                <TextInput
                  value={value}
                  onChange={setter}
                  onSubmit={handleSubmit(key)}
                  mask={secret ? '*' : undefined}
                  placeholder={`Enter ${label.toLowerCase()}...`}
                />
              </Box>
            )}

            {/* Show saved value (masked for token) after moving past the field */}
            {isDone && (
              <Box marginLeft={2}>
                <Text dimColor>{secret ? '*'.repeat(Math.min(value.length, 12)) : value}</Text>
              </Box>
            )}
          </Box>
        );
      })}

      {field === 'done' && <Text color='green'>✅ Config saved! Returning to home...</Text>}
    </Box>
  );
}
