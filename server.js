import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import OpenAI from "openai";

const app = express();
app.use(bodyParser.json());
app.use("/static", express.static("static")); // ses dosyaları buradan serve edilecek

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- TTS Endpoint ---
app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });

    const ttsPath = `temp_${Date.now()}.wav`;
    const outPath = `out_${Date.now()}.wav`;
    const mp3Path = `static/out_${Date.now()}.mp3`;

    // 1. OpenAI TTS ile ses üret
    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(ttsPath, buffer);
    });

    // 3. MP3’e çevir
    await new Promise((resolve, reject) => {
      exec(`ffmpeg -y -i ${outPath} ${mp3Path}`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      audioUrl: `https://${process.env.RAILWAY_STATIC_URL}/static/${path.basename(mp3Path)}`
    });
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({ error: "TTS failed" });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running...");
});
