import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { StateManager } from '../dist/state.js';

describe('State モジュール', () => {
  let tempDir: string;
  let stateManager: StateManager;

  beforeEach(async () => {
    // テスト用の一時ディレクトリを作成
    tempDir = await mkdtemp(join(tmpdir(), 'git-watch-test-'));
    const stateFilePath = join(tempDir, 'state.json');
    stateManager = new StateManager(stateFilePath);
  });

  afterEach(async () => {
    // 一時ディレクトリを削除
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('初期化', () => {
    test('新しい StateManager インスタンスを作成できる', () => {
      assert.ok(stateManager instanceof StateManager);
    });
  });

  describe('load', () => {
    test('状態ファイルが存在しない場合は空の状態を読み込む', async () => {
      await stateManager.load();
      // エラーなく読み込めることを確認
      assert.ok(true);
    });

    test('状態ファイルが存在する場合は内容を読み込む', async () => {
      // 先に保存してから読み込む
      await stateManager.load();
      await stateManager.updateNotified('/repo/path', 'abc123');

      // 新しいインスタンスで読み込む
      const newStateManager = new StateManager(join(tempDir, 'state.json'));
      await newStateManager.load();

      const shouldNotify = newStateManager.shouldNotify('/repo/path', 'abc123');
      assert.strictEqual(shouldNotify, false);
    });
  });

  describe('shouldNotify', () => {
    test('未通知のリポジトリの場合は true を返す', async () => {
      await stateManager.load();
      const shouldNotify = stateManager.shouldNotify('/new/repo', 'def456');
      assert.strictEqual(shouldNotify, true);
    });

    test('既に通知済みの同じ upstream HEAD の場合は false を返す', async () => {
      await stateManager.load();
      await stateManager.updateNotified('/repo/path', 'abc123');

      const shouldNotify = stateManager.shouldNotify('/repo/path', 'abc123');
      assert.strictEqual(shouldNotify, false);
    });

    test('同じリポジトリでも upstream HEAD が異なる場合は true を返す', async () => {
      await stateManager.load();
      await stateManager.updateNotified('/repo/path', 'abc123');

      const shouldNotify = stateManager.shouldNotify('/repo/path', 'def456');
      assert.strictEqual(shouldNotify, true);
    });
  });

  describe('updateNotified', () => {
    test('新しいリポジトリの通知状態を保存できる', async () => {
      await stateManager.load();
      await stateManager.updateNotified('/repo/path', 'abc123');

      const shouldNotify = stateManager.shouldNotify('/repo/path', 'abc123');
      assert.strictEqual(shouldNotify, false);
    });

    test('既存のリポジトリの通知状態を更新できる', async () => {
      await stateManager.load();
      await stateManager.updateNotified('/repo/path', 'abc123');
      await stateManager.updateNotified('/repo/path', 'def456');

      // 古い HEAD は通知済みではなくなる
      const shouldNotifyOld = stateManager.shouldNotify('/repo/path', 'abc123');
      assert.strictEqual(shouldNotifyOld, true);

      // 新しい HEAD は通知済み
      const shouldNotifyNew = stateManager.shouldNotify('/repo/path', 'def456');
      assert.strictEqual(shouldNotifyNew, false);
    });

    test('状態ファイルに永続化される', async () => {
      await stateManager.load();
      await stateManager.updateNotified('/repo/path', 'abc123');

      // 新しいインスタンスで読み込んでも状態が保持されている
      const newStateManager = new StateManager(join(tempDir, 'state.json'));
      await newStateManager.load();

      const shouldNotify = newStateManager.shouldNotify('/repo/path', 'abc123');
      assert.strictEqual(shouldNotify, false);
    });
  });

  describe('複数リポジトリの管理', () => {
    test('複数のリポジトリの状態を独立して管理できる', async () => {
      await stateManager.load();
      await stateManager.updateNotified('/repo/1', 'sha1');
      await stateManager.updateNotified('/repo/2', 'sha2');

      assert.strictEqual(stateManager.shouldNotify('/repo/1', 'sha1'), false);
      assert.strictEqual(stateManager.shouldNotify('/repo/2', 'sha2'), false);
      assert.strictEqual(stateManager.shouldNotify('/repo/1', 'sha2'), true);
      assert.strictEqual(stateManager.shouldNotify('/repo/2', 'sha1'), true);
    });
  });
});
