// /api/sensors/data  (POST)
let _latest = null;
let _history = [];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = req.body || {};
  const now = new Date().toISOString();

  const record = {
    deviceId: body.deviceId ?? 'unknown',
    location: body.location ?? null,
    sensorData: body.sensorData ?? {},
    timestamp: now, // ให้ฝั่งเซิร์ฟเวอร์ตีตราเวลาเอง
  };

  _latest = record;
  _history.push(record);
  // TODO: ภายหลังเปลี่ยนมาเก็บ DB (Supabase, MongoDB Atlas ฯลฯ)

  return res.status(200).json({ ok: true, saved: record });
}

// export state ให้ไฟล์อื่นใช้ (optional)
export { _latest as __LATEST, _history as __HISTORY };
