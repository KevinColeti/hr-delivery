import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const parsed: Record<string, string> = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key && parsed[key] === undefined) {
      parsed[key] = value;
    }
  }

  return parsed;
}

export function getEnvValue(key: string, fallback = ''): string {
  const fromProcess = process.env[key];
  if (fromProcess !== undefined && fromProcess !== '') {
    return fromProcess;
  }

  const envPath = resolve(process.cwd(), '.env');
  const parsed = parseEnvFile(envPath);
  return parsed[key] ?? fallback;
}
