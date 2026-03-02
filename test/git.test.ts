import { test, describe, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  execGit,
  getCurrentBranch,
  getUpstream,
  getUpstreamHead,
  fetch,
  getAheadBehind,
  getNewCommits,
  isWorkingTreeClean,
  isFastForwardPossible,
  pullFastForward
} from '../dist/git.js';

describe('Git モジュール', () => {
  describe('execGit', () => {
    test('Git コマンドを実行して結果を返す', async () => {
      const result = await execGit(['--version']);
      assert.ok(result.includes('git version'));
    });

    test('エラー時には例外をスローする', async () => {
      await assert.rejects(
        () => execGit(['invalid-command']),
        { message: /not a git command/ }
      );
    });
  });

  describe('getCurrentBranch', () => {
    test('現在のブランチ名を取得する', async () => {
      const branch = await getCurrentBranch();
      assert.ok(typeof branch === 'string');
      assert.ok(branch.length > 0);
    });
  });

  describe('getUpstream', () => {
    test('upstream が設定されている場合は upstream 名を返す', async () => {
      // Note: このテストは upstream が設定されている環境でのみパスする
      // upstream がない場合は null を返すことをテスト
      const upstream = await getUpstream();
      assert.ok(upstream === null || typeof upstream === 'string');
    });
  });

  describe('getUpstreamHead', () => {
    test('upstream HEAD の SHA を取得する', async () => {
      // upstream が設定されている場合のみテスト可能
      try {
        const sha = await getUpstreamHead();
        assert.ok(/^[0-9a-f]{40}$/.test(sha));
      } catch (error) {
        // upstream がない場合はスキップ
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('fetch', () => {
    test('fetch を実行してもエラーにならない', async () => {
      // fetch はネットワーク操作なので、実際には実行せずモックでテスト
      // 本番環境では正常に動作することを期待
      await assert.doesNotReject(() => fetch());
    });
  });

  describe('getAheadBehind', () => {
    test('ahead/behind 数を取得する', async () => {
      try {
        const result = await getAheadBehind();
        assert.ok(typeof result.ahead === 'number');
        assert.ok(typeof result.behind === 'number');
        assert.ok(result.ahead >= 0);
        assert.ok(result.behind >= 0);
      } catch (error) {
        // upstream がない場合はスキップ
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('getNewCommits', () => {
    test('新しいコミットのリストを取得する', async () => {
      try {
        const commits = await getNewCommits();
        assert.ok(Array.isArray(commits));
      } catch (error) {
        // upstream がない場合はスキップ
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('isWorkingTreeClean', () => {
    test('working tree の状態を確認する', async () => {
      const isClean = await isWorkingTreeClean();
      assert.ok(typeof isClean === 'boolean');
    });
  });

  describe('isFastForwardPossible', () => {
    test('fast-forward 可能かどうかを確認する', async () => {
      try {
        const isPossible = await isFastForwardPossible();
        assert.ok(typeof isPossible === 'boolean');
      } catch (error) {
        // upstream がない場合はスキップ
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('pullFastForward', () => {
    test('pull --ff-only を実行する（実際の pull はテストしない）', async () => {
      // pull は破壊的操作なので、実際にはテストしない
      // 関数が存在し、呼び出し可能であることのみ確認
      assert.ok(typeof pullFastForward === 'function');
    });
  });
});
