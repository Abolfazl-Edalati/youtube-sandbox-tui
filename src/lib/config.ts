import Conf from 'conf';
import type { AppConfig } from '../types.ts';

const conf = new Conf<AppConfig>({ projectName: 'youtube-sandbox-tui' });

export const getConfig = (): Partial<AppConfig> => conf.store;

export const saveConfig = (config: AppConfig) => {
  conf.set('token', config.token);
  conf.set('owner', config.owner);
  conf.set('repo', config.repo);
};

export const isConfigured = (): boolean => !!(conf.get('token') && conf.get('owner') && conf.get('repo'));
