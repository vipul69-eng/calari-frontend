/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";

const subscriptions: any[] = []; // In-memory store — use DB in production

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    subscriptions.push(req.body);
    return res.status(201).json({ ok: true });
  }
  res.status(200).json(subscriptions);
}

export { subscriptions }; // export for use in send script
