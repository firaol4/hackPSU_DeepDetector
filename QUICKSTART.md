# 🚀 Quick Start Guide

## What's Been Integrated

Your DeepDetector project now has **all three services working together**:

1. ✅ **Hash Generation** - Secure SHA-256 hashing for image authentication
2. ✅ **Hash Comparison** - Compare two images to detect tampering
3. ✅ **AI Deepfake Detection** - ML-powered detection (no reference needed)

---

## Start the System (Easy Mode)

### Option 1: One-Command Launch

```bash
./start.sh
```

This starts both Flask (port 5001) and Express (port 5000) automatically.

### Option 2: Manual Launch

**Terminal 1 - Flask AI Service:**
```bash
source venv/bin/activate
python app.py
```

**Terminal 2 - Express Backend:**
```bash
npm run dev
```

---

## Access the Features

Once both services are running:

### 🔍 **Main Scanner Page** (All 3 Features)
**URL:** http://localhost:5000/scanner-enhanced

This page has everything:

#### 1. AI Deepfake Detector (Top Section)
- Upload any image
- Click "Analyze with AI"
- Get instant verdict: Real vs AI-generated
- See confidence score and hash

#### 2. Hash Generator (Middle Section)
- Upload image to generate SHA-256 hash
- Optional: Check "Also run AI detection" for dual analysis
- Hash automatically saved to vault

#### 3. Hash Comparator (Bottom Section)
- Upload two images
- System compares their hashes
- Detects if images are identical or tampered

### 🗄️ **Hash Vault**
**URL:** http://localhost:5000/vault

- View all your stored hashes
- See AI detection results
- Search through history
- Click hashes to copy full values

### 🏠 **Landing Page**
**URL:** http://localhost:5000

Marketing page with project info

---

## How It Works Together

### Example Workflow 1: Secure Your Photos

1. Go to `/scanner-enhanced`
2. Upload your original photo in **Hash Generator** section
3. Check "Also run AI detection" 
4. Get SHA-256 hash + confirmation it's real
5. Store the hash in your vault
6. Later, if someone sends you a "modified" version, use **Hash Comparator** to verify

### Example Workflow 2: Verify Suspicious Image

1. Someone sends you an image that looks fake
2. Go to `/scanner-enhanced` → **AI Deepfake Detector**
3. Upload the image
4. AI analyzes it and tells you if it's AI-generated
5. Get confidence score + hash for your records

### Example Workflow 3: Detect Image Tampering

1. You have original image + suspicious copy
2. Go to **Hash Comparator** section
3. Upload both
4. If hashes don't match → image was altered

---

## System Architecture

```
┌─────────────────┐
│   Frontend      │
│  (Vanilla JS)   │
│  Port: 5000     │
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌──────────────┐   ┌──────────────┐
│   Express    │   │    Flask     │
│   Backend    │◄──│  ML Service  │
│  Port: 5000  │   │  Port: 5001  │
└──────┬───────┘   └──────────────┘
       │
       ▼
┌──────────────┐
│   MongoDB    │
│ Hash Vault   │
└──────────────┘
```

### Data Flow

1. **User uploads image** → Express backend
2. **Express calculates hash** → Saves to MongoDB
3. **If AI detection requested** → Express → Flask
4. **Flask runs EfficientNetB0** → Returns AI score
5. **Results stored** → MongoDB with hash + AI data
6. **User sees results** → Frontend displays everything

---

## File Upload Locations

- **Uploaded images:** `./uploads/`
- **Trained model:** `./model/best_model.keras`
- **Training data:** `./split_dataset/`

---

## Testing Each Feature

### Test 1: Hash Generation
```bash
# Upload any image via browser
# Should see SHA-256 hash like: 3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b
```

### Test 2: Comparison
```bash
# Upload same image twice → "✅ Hashes Match"
# Upload different images → "❌ No Match"
```

### Test 3: AI Detection
```bash
# Upload real photo → "✅ Real Image" (score < 50%)
# Upload AI-generated image → "⚠️ AI Generated" (score > 50%)
```

---

## Common Issues

### "Model not loaded"
- Make sure `model/best_model.keras` exists
- Train it with: `python train_model.py`
- Or AI detection will gracefully fail (other features still work)

### "MongoDB connection error"
- Start MongoDB: `brew services start mongodb-community` (Mac)
- Or use MongoDB Atlas URI in `.env`

### "Cannot connect to Flask"
- Make sure Flask is running on port 5001
- Check: `curl http://localhost:5001/health`

---

## Next Steps

1. ✅ Start both services
2. ✅ Visit http://localhost:5000/scanner-enhanced
3. ✅ Test all three features
4. ✅ Check vault at http://localhost:5000/vault
5. 🎉 Deploy or demo!

---

## Production Deployment

For production, consider:

- Use PM2 or systemd for process management
- Deploy Flask behind Gunicorn/uWSGI
- Use Nginx as reverse proxy
- Set up proper CORS policies
- Add rate limiting
- Use cloud MongoDB (Atlas)
- Store uploads in S3/Cloud Storage

---

**Questions?** Check the full README.md for detailed docs!
