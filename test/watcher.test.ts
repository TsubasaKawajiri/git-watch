import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Watcher } from '../dist/watcher.js';

describe('Watcher モジュール', () => {
  let watcher: Watcher;

  beforeEach(() => {
    watcher = new Watcher();
  });

  afterEach(() => {
    watcher.stop();
  });

  describe('インスタンス作成', () => {
    test('新しい Watcher インスタンスを作成できる', () => {
      assert.ok(watcher instanceof Watcher);
    });
  });

  describe('start/stop', () => {
    test('start を呼び出してもエラーにならない', async () => {
      // すぐに stop するため、実際のチェックは実行されない
      const startPromise = watcher.start({ interval: 1, autoPull: false });

      // 少し待ってから stop
      await new Promise(resolve => setTimeout(resolve, 100));
      watcher.stop();

      // start は Promise を返すが、stop によって中断される
      await assert.doesNotReject(() => startPromise);
    });

    test('stop を呼び出すとウォッチャーが停止する', () => {
      assert.doesNotThrow(() => watcher.stop());
    });

    test('stop を複数回呼び出してもエラーにならない', () => {
      watcher.stop();
      assert.doesNotThrow(() => watcher.stop());
    });
  });

  describe('options', () => {
    test('interval オプションを受け取れる', async () => {
      const startPromise = watcher.start({ interval: 5, autoPull: false });

      await new Promise(resolve => setTimeout(resolve, 50));
      watcher.stop();

      await assert.doesNotReject(() => startPromise);
    });

    test('autoPull オプションを受け取れる', async () => {
      const startPromise = watcher.start({ interval: 5, autoPull: true });

      await new Promise(resolve => setTimeout(resolve, 50));
      watcher.stop();

      await assert.doesNotReject(() => startPromise);
    });
  });
});
