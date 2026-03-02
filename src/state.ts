import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * リポジトリの通知状態を管理するクラス
 */
export class StateManager {
  private stateFilePath: string;
  private state: Map<string, string>;

  constructor(stateFilePath: string) {
    this.stateFilePath = stateFilePath;
    this.state = new Map();
  }

  /**
   * 状態ファイルを読み込む
   */
  async load(): Promise<void> {
    try {
      const content = await readFile(this.stateFilePath, 'utf-8');
      const data = JSON.parse(content);
      this.state = new Map(Object.entries(data));
    } catch (error) {
      // ファイルが存在しない場合は空の状態で開始
      this.state = new Map();
    }
  }

  /**
   * 状態ファイルに保存する
   */
  private async save(): Promise<void> {
    const data = Object.fromEntries(this.state);
    const content = JSON.stringify(data, null, 2);

    // ディレクトリが存在しない場合は作成
    const dir = dirname(this.stateFilePath);
    await mkdir(dir, { recursive: true });

    await writeFile(this.stateFilePath, content, 'utf-8');
  }

  /**
   * 通知すべきかどうかを判定する
   */
  shouldNotify(repoPath: string, upstreamHead: string): boolean {
    const lastNotified = this.state.get(repoPath);
    return lastNotified !== upstreamHead;
  }

  /**
   * 通知済み状態を更新する
   */
  async updateNotified(repoPath: string, upstreamHead: string): Promise<void> {
    this.state.set(repoPath, upstreamHead);
    await this.save();
  }
}
