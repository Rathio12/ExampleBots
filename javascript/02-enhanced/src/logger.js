// A tiny levelled logger. Real projects often use pino or winston, but this
// shows the idea without extra dependencies.
import { config } from './config.js';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const COLORS = { debug: '\x1b[90m', info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m' };
const RESET = '\x1b[0m';
const threshold = LEVELS[config.logLevel] ?? LEVELS.info;

function log(level, ...args) {
  if (LEVELS[level] < threshold) return;
  const time = new Date().toISOString();
  const output = level === 'error' ? console.error : console.log;
  output(`${COLORS[level]}${time} ${level.toUpperCase().padEnd(5)}${RESET}`, ...args);
}

export const logger = {
  debug: (...args) => log('debug', ...args),
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args),
};
