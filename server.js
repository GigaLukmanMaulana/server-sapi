const express = require("express");
const admin   = require("firebase-admin");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ================================
// INIT FIREBASE ADMIN SDK
// Pakai environment variable supaya credentials tidak hardcode
// ================================
admin.initializeApp({
  credential: admin.credential.cert({
    projectId:    process.env.FIREBASE_PROJECT_ID,
    clientEmail:  process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:   process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.database();

// ================================
// ENDPOINT: TERIMA DATA DARI ESP32
// ================================
app.post("/update", async (req, res) => {
  const data = req.body;

  if (!data || !data.id_sapi) {
    return res.status(400).json({ status: "error", pesan: "Data tidak valid!" });
  }

  const waktu = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

  const record = {
    waktu,
    id_sapi:         data.id_sapi         ?? "-",
    nama_sapi:       data.nama_sapi        ?? "-",
    collar_id:       data.collar_id        ?? "-",
    suhu:            data.suhu             ?? 0,
    suhu_dht:        data.suhu_dht         ?? 0,
    suhu_lingkungan: data.suhu_lingkungan  ?? 0,
    lembap:          data.lembap           ?? 0,
    latitude:        data.latitude         ?? 0,
    longitude:       data.longitude        ?? 0,
    acc_x:           data.acc_x            ?? 0,
    acc_y:           data.acc_y            ?? 0,
    acc_z:           data.acc_z            ?? 0,
    is_dummy:        data.is_dummy         ?? false,
    is_active:       data.is_active        ?? true,
    is_recording:    data.is_recording     ?? false,
  };

  try {
    // Simpan ke Firebase RTDB di path /<id_sapi>
    await db.ref(`/${data.id_sapi}`).update(record);

    console.log(`✅ [${waktu}] Data ${data.id_sapi} berhasil disimpan ke Firebase`);
    console.log(`   🌡️  Suhu : ${record.suhu}°C | 💧 Lembap: ${record.lembap}%`);
    console.log(`   📍 GPS  : ${record.latitude}, ${record.longitude}`);

    res.status(200).json({ status: "ok", pesan: "Data diterima!", waktu });
  } catch (err) {
    console.error("❌ Error Firebase:", err.message);
    res.status(500).json({ status: "error", pesan: err.message });
  }
});

// ================================
// ENDPOINT: CEK SERVER
// ================================
app.get("/", (req, res) => {
  res.send("✅ Server collar sapi aktif! POST ke /update");
});

// ================================
// JALANKAN
// ================================
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);
});
