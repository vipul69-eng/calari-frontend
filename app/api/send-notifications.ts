/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";
import webpush from "web-push";
import { subscriptions } from "./save-subscription";

webpush.setVapidDetails(
  "mailto:your@email.com",
  process.env.NEXT_PUBLIC_VAPID_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const payload = JSON.stringify({
    title: "Time to track food",
    body: "Log your calories!",
    url: "/",
  });

  await Promise.all(
    subscriptions.map(sub =>
      webpush.sendNotification(sub, payload).catch((err: any) => console.error(err))
    )
  );

  res.status(200).json({ ok: true });
}
