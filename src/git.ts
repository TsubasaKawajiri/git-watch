import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * Git コマンドを実行する基本関数
 */
export async function execGit(args: string[]): Promise<string> {
  const { stdout } = await execAsync(`git ${args.join(' ')}`);
  return stdout.trim();
}

/**
 * 現在のブランチ名を取得
 */
export async function getCurrentBranch(): Promise<string> {
  return execGit(['rev-parse', '--abbrev-ref', 'HEAD']);
}

/**
 * upstream ブランチ名を取得（upstream がない場合は null）
 */
export async function getUpstream(): Promise<string | null> {
  try {
    return await execGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']);
  } catch {
    return null;
  }
}

/**
 * upstream HEAD の SHA を取得
 */
export async function getUpstreamHead(): Promise<string> {
  return execGit(['rev-parse', '@{upstream}']);
}

/**
 * fetch を実行
 */
export async function fetch(): Promise<void> {
  await execGit(['fetch', '--prune', '--tags']);
}

/**
 * ahead/behind 数を取得
 */
export async function getAheadBehind(): Promise<{ ahead: number; behind: number }> {
  const output = await execGit(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}']);
  const [ahead, behind] = output.split('\t').map(Number);
  return { ahead, behind };
}

/**
 * 新しいコミットのリストを取得
 */
export async function getNewCommits(): Promise<string[]> {
  const output = await execGit(['log', '--oneline', 'HEAD..@{upstream}']);
  return output ? output.split('\n') : [];
}

/**
 * working tree がクリーンかどうかを確認
 */
export async function isWorkingTreeClean(): Promise<boolean> {
  try {
    await execGit(['diff', '--quiet']);
    await execGit(['diff', '--cached', '--quiet']);
    return true;
  } catch {
    return false;
  }
}

/**
 * fast-forward pull が可能かどうかを確認
 */
export async function isFastForwardPossible(): Promise<boolean> {
  try {
    await execGit(['merge-base', '--is-ancestor', 'HEAD', '@{upstream}']);
    return true;
  } catch {
    return false;
  }
}

/**
 * fast-forward pull を実行
 */
export async function pullFastForward(): Promise<void> {
  await execGit(['pull', '--ff-only']);
}
