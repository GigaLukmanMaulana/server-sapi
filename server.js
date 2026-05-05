const express = require("express");
const admin   = require("firebase-admin");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ================================
// INIT FIREBASE ADMIN SDK
// ================================
admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.database();

const toNum = (val, def = 0) =>
  val !== undefined && val !== null && !isNaN(val) ? Number(val) : def;

// ================================
// ENDPOINT: TERIMA DATA DARI ESP32
// POST /update
// ================================
app.post("/update", async (req, res) => {
  const data = req.body;

  if (!data || !data.id_sapi) {
    return res.status(400).json({ status: "error", pesan: "Data tidak valid atau id_sapi kosong!" });
  }

  const waktu = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

  const record = {
    waktu,
    id_sapi:         String(data.id_sapi),
    suhu:            toNum(data.suhu),
    suhu_dht:        toNum(data.suhu_dht),
    suhu_lingkungan: toNum(data.suhu_lingkungan),
    lembap:          toNum(data.lembap),
    latitude:        toNum(data.latitude),
    longitude:       toNum(data.longitude),
    acc_x:           toNum(data.acc_x),
    acc_y:           toNum(data.acc_y),
    acc_z:           toNum(data.acc_z),
    is_dummy:        data.is_dummy  ?? false,
    is_active:       data.is_active ?? true,
  };

  try {
    // Tulis langsung ke /<id_sapi>
    await db.ref(`/${data.id_sapi}`).update(record);

    console.log(`✅ [${waktu}] ${data.id_sapi} → Firebase OK`);
    console.log(`   🌡️  Suhu : ${record.suhu}°C | 💧 Lembap: ${record.lembap}%`);
    console.log(`   📍 GPS  : ${record.latitude}, ${record.longitude}`);

    res.status(200).json({ status: "ok", pesan: "Data diterima!", waktu });
  } catch (err) {
    console.error("❌ Firebase Error:", err.message);
    res.status(500).json({ status: "error", pesan: err.message });
  }
});

// ================================
// ENDPOINT: CEK STATUS SERVER
// ================================
app.get("/", (req, res) => {
  res.json({
    status:  "ok",
    pesan:   "Server collar sapi aktif! 🐄",
    waktu:   new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
    version: "2.1.0",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// ================================
// JALANKAN SERVER
// ================================
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);
  console.log(`📡 Menunggu data dari ESP32...`);
});
