import { NotificationBase } from "./notification.base";

export class Notifier {
  private notifications: NotificationBase[];

  constructor(...notifications: NotificationBase[]) {
    this.notifications = notifications;
  }

  async send(): Promise<void> {
    const results = await Promise.allSettled(
      this.notifications.map((n) => n.send())
    );

    const failed = results.find(
      (result): result is PromiseRejectedResult => result.status === "rejected"
    );

    if (failed) {
      throw failed.reason;
    }
  }
}