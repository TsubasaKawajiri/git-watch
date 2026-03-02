import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * macOS 通知センターに通知を送信する
 */
export async function notify(title: string, message: string): Promise<void> {
  // メッセージ内の特殊文字をエスケープ
  const escapedTitle = title.replace(/"/g, '\\"');
  const escapedMessage = message.replace(/"/g, '\\"');

  const script = `display notification "${escapedMessage}" with title "${escapedTitle}"`;
  await execAsync(`osascript -e '${script}'`);
}
