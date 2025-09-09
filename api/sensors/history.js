import { __HISTORY } from "./data.js";

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  res.status(200).json({ ok: true, count: __HISTORY.length, data: __HISTORY });
}
