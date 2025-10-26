# DeepDetector 🔍

**HackPSU Project** - AI-powered deepfake detection and image authentication system

## Features

### 🎯 Three Core Services

1. **AI Deepfake Detection** - Uses EfficientNetB0 CNN to detect AI-generated images (no reference needed)
2. **Image Hashing & Authentication** - Generate SHA-256 hashes to secure and verify your content
3. **Hash Comparison** - Compare two images to detect if one is a manipulated version

### 🛠️ Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Backend**: Node.js (Express) + Python (Flask)
- **ML Model**: TensorFlow/Keras EfficientNetB0
- **Database**: MongoDB
- **Hashing**: SHA-256 (client-side + server-side)

---

## Setup Instructions

### Prerequisites

- **Node.js** (v18+)
- **Python** (3.9+)
- **MongoDB** (local or MongoDB Atlas)

### 1. Clone & Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/deepscan
PORT=5000
```

### 3. Train the AI Model (Optional)

If you want to train your own model:

```bash
# Ensure you have training data in split_dataset/ with train/val/test folders
# Each should have 'real' and 'fake' subfolders
python train_model.py
```

The trained model will be saved to `model/best_model.keras`

> **Note**: If you skip training, the system will run without AI detection (hash generation and comparison will still work)

### 4. Start the Services

You need to run **both servers** simultaneously:

#### Terminal 1: Flask ML Service (Port 5001)
```bash
source venv/bin/activate
python app.py
```

#### Terminal 2: Express Backend (Port 5000)
```bash
npm run dev
```

### 5. Access the Application

Open your browser to: **http://localhost:5000**

---

## Usage Guide

### 🔍 AI Deepfake Detector

1. Navigate to `/scanner-enhanced` 
2. Upload an image in the **AI Deepfake Detector** section
3. Click "Analyze with AI"
4. View results:
   - ✅ **Real Image** (AI score < 50%)
   - ⚠️ **AI Generated** (AI score > 50%)
   - Confidence percentage
   - SHA-256 hash of the image

### 🔐 Hash Generation

1. Go to **Hash Your Content** section
2. Upload an image
3. Optional: Check "Also run AI detection" for dual analysis
4. Get instant SHA-256 hash + optional AI verdict
5. Hash is automatically stored in your vault

### ⚖️ Hash Comparison

1. Scroll to **Compare Hash Values**
2. Upload two images
3. Click "Compare"
4. See if hashes match (useful for detecting manipulated copies)

### 🗄️ Hash Vault

- Navigate to `/vault` to see all your stored hashes
- Click any truncated hash to view full value
- Search through your history
- See AI detection results and comparison history

---

## API Endpoints

### Express Backend (Port 5000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload-hash` | POST | Upload image, generate hash, optional AI detection |
| `/compare` | POST | Compare two images by hash |
| `/detect-ai` | POST | Run AI detection on single image |
| `/api/vault` | GET | Retrieve all stored hashes |
| `/api/history` | GET | Get comparison history |
| `/api/health` | GET | Backend health check |

### Flask ML Service (Port 5001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/check-image` | POST | AI deepfake detection |
| `/health` | GET | Model status check |

---

## File Structure

```
hackPSU_DeepDetector/
├── app.py                      # Flask ML service
├── server-unified.js           # Express backend (unified)
├── train_model.py              # Model training script
├── preprocessing.py            # Image preprocessing utilities
├── hasher.py                   # SHA-256 hashing utility
├── public/                     # Frontend files
│   ├── index.html              # Landing page
│   ├── scanner-enhanced.html   # Unified scanner (all 3 features)
│   ├── vault.html              # Hash vault viewer
│   └── style.css               # Shared styles
├── model/                      # Trained ML models (gitignored)
│   └── best_model.keras
├── split_dataset/              # Training data
│   ├── train/
│   ├── val/
│   └── test/
├── uploads/                    # User uploaded images
└── requirements.txt            # Python dependencies
```

---

## How It Works

### AI Detection Pipeline

1. User uploads image via frontend
2. Express backend receives file → saves to `/uploads`
3. Backend forwards to Flask service at `localhost:5001/check-image`
4. Flask loads EfficientNetB0 model
5. Image preprocessed to 128x128, normalized
6. Model predicts AI probability (0-1 scale)
7. Results returned: `ai_score`, `ai_generated`, `confidence`
8. Stored in MongoDB with hash

### Security Features

- **Client-side hashing**: SHA-256 calculated in browser (Web Crypto API)
- **Server-side verification**: Backend recalculates hash for integrity
- **Immutable records**: All hashes stored with timestamps
- **No auth bypass**: All uploads logged in database

---

## Troubleshooting

### Model Not Loading
```
⚠️ Model not found at model/best_model.keras
```
**Solution**: Train the model using `python train_model.py` or AI detection will be disabled

### MongoDB Connection Error
```
❌ MongoDB connection error
```
**Solution**: 
- Start MongoDB: `brew services start mongodb-community` (Mac) or `sudo systemctl start mongod` (Linux)
- Or update `.env` with MongoDB Atlas URI

### AI Service Unavailable
```
error: "AI service unavailable"
```
**Solution**: Make sure Flask is running on port 5001 (`python app.py`)

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: 
```bash
# Find process using port
lsof -ti:5000
# Kill it
kill -9 <PID>
```

---

## Future Enhancements

- [ ] User authentication system
- [ ] Batch processing for multiple images
- [ ] LIME/SHAP explainability visualizations
- [ ] Real-time video deepfake detection
- [ ] Blockchain integration for hash immutability
- [ ] Browser extension for instant verification

---

## Team

**geeksquad** @ HackPSU 2025  
*Powered by caffeine and gen AI* ☕🤖

---

## License

MIT License - Built for educational purposes at HackPSU hackathon
