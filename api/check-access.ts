import type { VercelRequest, VercelResponse } from "@vercel/node";

const ACCESS_KEY = process.env.ACCESS_KEY;

export default function handler(req: VercelRequest, res: VercelResponse) {
  const key = req.query.key as string | undefined;

  if (!ACCESS_KEY || key !== ACCESS_KEY) {
    return res.status(403).json({ error: "Invalid access key" });
  }

  return res.status(200).json({ ok: true });
}
