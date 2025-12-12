/**
 * Polls a condition until it resolves or times out.
 */
export async function waitFor(
  condition: () => boolean,
  failureMessage: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let counter = 0;
    const interval = setInterval(() => {
      counter++;
      if (condition()) {
        clearInterval(interval);
        resolve();
      } else if (counter > 20) {
        clearInterval(interval);
        reject(new Error(failureMessage));
      }
    }, 500);
  });
}
