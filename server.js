import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const app = express();
app.use(bodyParser.json());

// static klasörü yoksa oluştur
if (!fs.existsSync("static")) {
  fs.mkdirSync("static");
}

app.use("/static", express.static("static")); // ses dosyaları buradan serve edilecek

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- TTS Endpoint ---
app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });

    const wavPath = `static/out_${Date.now()}.wav`;

    // 1. OpenAI TTS ile ses üret
    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "onyx",
      input: text,
      instructions="Speak in a harsh, intense, commanding tone, like a drill sergeant. Emphasize discipline and toughness. You are David Goggins.",
      format: "wav"
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(wavPath, buffer);

    // 2. Geriye sesin URL'sini dön
    res.json({
      audioUrl: `https://${process.env.RAILWAY_STATIC_URL}/static/${path.basename(wavPath)}`
    });
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({ error: "TTS failed" });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running...");
});
