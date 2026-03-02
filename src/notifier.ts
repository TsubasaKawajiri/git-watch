import notifier from 'node-notifier';

/**
 * デスクトップ通知を送信する
 */
export async function notify(title: string, message: string): Promise<void> {
  return new Promise((resolve, reject) => {
    notifier.notify(
      {
        title,
        message,
        sound: false, // macOS のデフォルト通知音を使用しない
        wait: false,  // 通知のクリックを待たない
      },
      (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });
}
