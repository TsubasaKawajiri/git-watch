#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { Watcher } from './watcher.js';

const { values } = parseArgs({
  options: {
    interval: {
      type: 'string',
      short: 'i',
      default: '60'
    },
    'auto-pull': {
      type: 'boolean',
      default: false
    },
    help: {
      type: 'boolean',
      short: 'h',
      default: false
    }
  },
  strict: true,
  allowPositionals: false
});

// ヘルプメッセージ
if (values.help) {
  console.log(`
git-watch - Watch Git repository for upstream updates

Usage:
  git-watch [options]

Options:
  -i, --interval <seconds>  Check interval in seconds (default: 60)
      --auto-pull           Automatically pull if safe (default: false)
  -h, --help                Show this help message

Examples:
  git-watch                          # Check every 60 seconds (notify only)
  git-watch --interval 30            # Check every 30 seconds
  git-watch --auto-pull              # Enable automatic pull
  git-watch --interval 120 --auto-pull

Notes:
  - Auto-pull only works if:
    - Working tree is clean (no uncommitted changes)
    - Fast-forward is possible (no divergent history)
  - State is persisted in ~/.git-watch/state.json
  - Press Ctrl+C to stop

For more information, visit: https://github.com/your-username/git-watch
`);
  process.exit(0);
}

// interval のバリデーション
const interval = parseInt(values.interval as string, 10);
if (isNaN(interval) || interval <= 0) {
  console.error('Error: interval must be a positive number');
  process.exit(1);
}

// Watcher を起動
const watcher = new Watcher();
await watcher.start({
  interval,
  autoPull: values['auto-pull'] as boolean
});
