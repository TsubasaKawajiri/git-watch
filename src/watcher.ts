import { homedir } from 'node:os';
import { join } from 'node:path';
import { cwd } from 'node:process';
import * as git from './git.js';
import { notify } from './notifier.js';
import { StateManager } from './state.js';

export interface WatchOptions {
  interval: number;   // 秒単位
  autoPull: boolean;
}

/**
 * Git リポジトリの upstream 変更を監視するクラス
 */
export class Watcher {
  private intervalId?: NodeJS.Timeout;
  private backoffMultiplier: number = 1;
  private readonly maxBackoff: number = 16;
  private stateManager: StateManager;
  private repoPath: string;

  constructor() {
    this.repoPath = cwd();
    const stateFilePath = join(homedir(), '.git-watch', 'state.json');
    this.stateManager = new StateManager(stateFilePath);
  }

  /**
   * ウォッチャーを開始する
   */
  async start(options: WatchOptions): Promise<void> {
    // 状態ファイルを読み込む
    await this.stateManager.load();

    console.log(`Watching repository at ${this.repoPath}`);
    console.log(`Checking every ${options.interval} seconds`);
    console.log(`Auto-pull: ${options.autoPull ? 'enabled' : 'disabled'}`);
    console.log('Press Ctrl+C to stop\n');

    // 即座に最初のチェックを実行
    await this.check(options);

    // 定期的なチェックを開始
    this.intervalId = setInterval(async () => {
      await this.check(options);
    }, options.interval * 1000);

    // シグナルハンドラーを設定
    const handleSignal = () => {
      console.log('\n\nStopping watcher...');
      this.stop();
      process.exit(0);
    };

    process.on('SIGINT', handleSignal);
    process.on('SIGTERM', handleSignal);
  }

  /**
   * 定期的なチェックを実行する
   */
  private async check(options: WatchOptions): Promise<void> {
    try {
      console.log(`[${new Date().toLocaleTimeString()}] Checking for updates...`);

      // fetch を実行
      await git.fetch();

      // upstream を取得
      const upstream = await git.getUpstream();
      if (!upstream) {
        console.log('No upstream branch configured. Skipping...\n');
        return;
      }

      // ahead/behind を確認
      const { ahead, behind } = await git.getAheadBehind();

      if (behind === 0) {
        console.log('Already up to date.\n');
        // バックオフをリセット
        this.backoffMultiplier = 1;
        return;
      }

      // upstream HEAD を取得
      const upstreamHead = await git.getUpstreamHead();

      // 重複通知をチェック
      if (!this.stateManager.shouldNotify(this.repoPath, upstreamHead)) {
        console.log('Already notified for this update. Skipping...\n');
        return;
      }

      // 新しいコミットを取得
      const newCommits = await git.getNewCommits();
      const commitSummary = newCommits.slice(0, 3).join('\n');
      const moreCommits = newCommits.length > 3 ? `\n... and ${newCommits.length - 3} more` : '';

      console.log(`Found ${behind} new commit(s):\n${commitSummary}${moreCommits}\n`);

      // auto-pull オプションの場合
      if (options.autoPull) {
        const { canPull, reason } = await this.checkAutoPullConditions();

        if (canPull) {
          console.log('Pulling changes...');
          await git.pullFastForward();
          await notify(
            'Git Watch: Auto-pulled',
            `Pulled ${behind} commit(s) from ${upstream}`
          );
          console.log('Successfully pulled changes.\n');
        } else {
          await notify(
            'Git Watch: Updates available (cannot auto-pull)',
            reason || 'Unknown reason'
          );
          console.log(`Cannot auto-pull: ${reason}\n`);
        }
      } else {
        // 標準通知
        await notify(
          'Git Watch: Updates available',
          `${behind} new commit(s) on ${upstream}`
        );
        console.log('Notification sent.\n');
      }

      // 状態を保存
      await this.stateManager.updateNotified(this.repoPath, upstreamHead);

      // バックオフをリセット
      this.backoffMultiplier = 1;
    } catch (error) {
      console.error(`Error during check: ${error}`);

      // バックオフを適用
      if (this.backoffMultiplier < this.maxBackoff) {
        this.backoffMultiplier *= 2;
        console.log(`Backing off... (multiplier: ${this.backoffMultiplier})\n`);
      }
    }
  }

  /**
   * auto-pull の条件をチェックする
   */
  private async checkAutoPullConditions(): Promise<{ canPull: boolean; reason?: string }> {
    // working tree が clean かチェック
    const isClean = await git.isWorkingTreeClean();
    if (!isClean) {
      return {
        canPull: false,
        reason: 'Working tree is not clean. Please commit or stash your changes.'
      };
    }

    // fast-forward 可能かチェック
    const isFastForward = await git.isFastForwardPossible();
    if (!isFastForward) {
      return {
        canPull: false,
        reason: 'Fast-forward is not possible. Manual merge may be required.'
      };
    }

    return { canPull: true };
  }

  /**
   * ウォッチャーを停止する
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
