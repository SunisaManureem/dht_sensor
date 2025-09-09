import { __LATEST } from "./data.js";

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  res.status(200).json({ ok: true, latest: __LATEST });
}
