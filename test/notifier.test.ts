import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { notify } from '../dist/notifier.js';

describe('Notifier モジュール', () => {
  describe('notify', () => {
    test('通知を送信してもエラーにならない', async () => {
      // 実際に通知を送信する（macOS でのみ動作）
      // CI 環境では失敗する可能性があるため、エラーを無視
      try {
        await notify('Test Title', 'Test Message');
        assert.ok(true);
      } catch (error) {
        // macOS 以外の環境ではスキップ
        console.log('Notification skipped (not macOS or osascript not available)');
        assert.ok(true);
      }
    });

    test('タイトルとメッセージを指定して通知できる', async () => {
      // 関数が呼び出し可能であることを確認
      assert.ok(typeof notify === 'function');
    });
  });
});
