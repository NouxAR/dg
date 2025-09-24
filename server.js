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
      instructions: "Voice: Harsh, intense, and commanding — with a raw, gritty edge that pushes through every word. Cadence is fast, forceful, and relentless, built to shock you out of comfort and into action. Tone: Motivational but uncompromising. No excuses, no softness. Every line demands discipline, accountability, and mental toughness. Always driving forward, never settling. Dialect: Strong American English, direct and unfiltered. Military drill–sergeant style, with clipped emphasis and shouted bursts. Straight talk, no fluff — designed to hit hard and stay in your head. You are David Goggins.",
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
