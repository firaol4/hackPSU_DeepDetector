import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// File upload setup
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// MongoDB Schema
const imageHashSchema = new mongoose.Schema({
  file1_hash: { type: String, required: true },
  file2_hash: { type: String, default: null },
  file1_path: { type: String, default: null },
  file2_path: { type: String, default: null },
  match: { type: Boolean, default: null },
  ai_score: { type: Number, default: null },
  ai_generated: { type: Boolean, default: null },
  created_at: { type: Date, default: Date.now }
});

const ImageHash = mongoose.model("ImageHash", imageHashSchema);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/deepscan")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Helper: Calculate SHA-256 hash
function calculateHash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// Helper: Call Flask AI detection service
async function detectAI(filePath) {
  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    formData.append("image", blob, path.basename(filePath));

    const response = await axios.post("http://localhost:5001/check-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000
    });

    return response.data;
  } catch (error) {
    console.error("AI detection error:", error.message);
    return { error: "AI service unavailable", ai_score: 0.0, ai_generated: false };
  }
}

// ===== ROUTES =====

// 1. Single file upload + hash generation + AI detection
app.post("/upload-hash", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const hash = calculateHash(fileBuffer);

    // Optional: AI detection
    let aiResult = null;
    if (req.body.detectAI === "true") {
      aiResult = await detectAI(req.file.path);
    }

    // Store in database
    const record = await ImageHash.create({
      file1_hash: hash,
      file1_path: `/uploads/${req.file.filename}`,
      ai_score: aiResult?.ai_score || null,
      ai_generated: aiResult?.ai_generated || null
    });

    res.json({
      status: "success",
      hash,
      file_path: record.file1_path,
      ai_result: aiResult,
      record_id: record._id
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Compare two images by hash
app.post("/compare", upload.array("images", 2), async (req, res) => {
  try {
    if (!req.files || req.files.length !== 2) {
      return res.status(400).json({ error: "Please upload exactly 2 images" });
    }

    const file1Buffer = fs.readFileSync(req.files[0].path);
    const file2Buffer = fs.readFileSync(req.files[1].path);

    const hash1 = calculateHash(file1Buffer);
    const hash2 = calculateHash(file2Buffer);
    const match = hash1 === hash2;

    // Store comparison in database
    const record = await ImageHash.create({
      file1_hash: hash1,
      file2_hash: hash2,
      file1_path: `/uploads/${req.files[0].filename}`,
      file2_path: `/uploads/${req.files[1].filename}`,
      match
    });

    res.json({
      status: "success",
      hash1,
      hash2,
      match,
      record_id: record._id
    });

  } catch (error) {
    console.error("Compare error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. AI Detection only (standalone)
app.post("/detect-ai", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const aiResult = await detectAI(req.file.path);
    const fileBuffer = fs.readFileSync(req.file.path);
    const hash = calculateHash(fileBuffer);

    // Store in database
    const record = await ImageHash.create({
      file1_hash: hash,
      file1_path: `/uploads/${req.file.filename}`,
      ai_score: aiResult.ai_score,
      ai_generated: aiResult.ai_generated
    });

    res.json({
      status: "success",
      hash,
      ...aiResult,
      record_id: record._id
    });

  } catch (error) {
    console.error("AI detection error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Get vault (all stored hashes)
app.get("/api/vault", async (req, res) => {
  try {
    const records = await ImageHash.find().sort({ created_at: -1 }).limit(100);
    res.json(records);
  } catch (error) {
    console.error("Vault fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Get comparison history
app.get("/api/history", async (req, res) => {
  try {
    const records = await ImageHash.find({ file2_hash: { $ne: null } })
      .sort({ created_at: -1 })
      .limit(50);
    res.json(records);
  } catch (error) {
    console.error("History fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Serve uploaded files
app.use("/uploads", express.static(uploadDir));

// 7. Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "DeepDetector Backend" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${path.join(__dirname, "public")}`);
});
