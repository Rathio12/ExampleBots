// Structured logger. In production (NODE_ENV=production) it prints one JSON
// object per line, which log tools (Loki, Datadog, CloudWatch…) can parse.
// In development it prints coloured, human-friendly lines.
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const COLORS = { debug: '\x1b[90m', info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m' };

export function createLogger(level = 'info', { json = process.env.NODE_ENV === 'production' } = {}) {
  const threshold = LEVELS[level] ?? LEVELS.info;

  function log(lvl, message, meta) {
    if (LEVELS[lvl] < threshold) return;
    const time = new Date().toISOString();

    // Errors are not JSON-serialisable by default — extract the useful bits.
    if (meta instanceof Error) meta = { error: meta.message, stack: meta.stack };

    if (json) {
      console.log(JSON.stringify({ time, level: lvl, message, ...meta }));
    } else {
      const extra = meta ? ` ${meta.stack ?? JSON.stringify(meta)}` : '';
      console.log(`${COLORS[lvl]}${time} ${lvl.toUpperCase().padEnd(5)}\x1b[0m ${message}${extra}`);
    }
  }

  return {
    debug: (message, meta) => log('debug', message, meta),
    info: (message, meta) => log('info', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    error: (message, meta) => log('error', message, meta),
  };
}
