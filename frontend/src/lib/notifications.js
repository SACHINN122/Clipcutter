/**
 * Browser notification helpers for completion alerts.
 */

export function supportsNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission() {
  if (!supportsNotifications()) {
    return 'unsupported';
  }

  if (Notification.permission !== 'default') {
    return Notification.permission;
  }

  return Notification.requestPermission();
}

export function showCompletionNotification(jobId) {
  if (!supportsNotifications() || Notification.permission !== 'granted') {
    return false;
  }

  new Notification('Clipo AI', {
    body: 'Your Clipo clip generation is complete. Open the results to review and download them.',
    tag: `clipo-complete-${jobId}`,
  });

  return true;
}
