import { useCallback } from "react";

export function useNotification() {
  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!("Notification" in window)) {
        return;
      }

      if (Notification.permission === "granted") {
        new Notification(title, options);
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(title, options);
          }
        });
      } else {
      }
    },
    [],
  );

  return { sendNotification };
}
