import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// API route for NPC dialogue
app.post('/api/npc-dialogue', async (req, res) => {
  try {
    const { npcName, npcRole, npcPersonality, userMessage } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        reply: null,
        fallback: true,
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Kamu adalah NPC karakter video game simulasi bertani bernama "${npcName}" (${npcRole}) di desa Isopolis. Perilakumu: ${npcPersonality}. Pemain bertanya: "${userMessage}". Jawablah dalam Bahasa Indonesia yang singkat (1-2 kalimat), ramah, dan berkarakter game bertani yang hangat.`,
    });

    return res.json({ reply: response.text || 'Terima kasih sudah menyapa di desa Isopolis!' });
  } catch (error) {
    console.error('Gemini error:', error);
    return res.status(200).json({
      reply: null,
      fallback: true,
    });
  }
});

// Vite middleware in development
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
