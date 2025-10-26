from flask import Flask, request, jsonify
from flask_cors import CORS
from keras.models import load_model
import numpy as np
import io
import os
from preprocessing import preprocess_image

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Load your model
model = None
MODEL_PATH = "model/best_model.keras"

if os.path.exists(MODEL_PATH):
    try:
        model = load_model(MODEL_PATH)
        print(f"✅ Model loaded from {MODEL_PATH}")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
else:
    print(f"⚠️ Model not found at {MODEL_PATH} — placeholder mode active.")

@app.route("/check-image", methods=["POST"])
def check_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    if model is None:
        return jsonify({"error": "Model not loaded", "ai_score": 0.0, "ai_generated": False}), 503

    image_file = request.files['image']
    image_bytes = io.BytesIO(image_file.read())

    try:
        # Preprocess and predict (using 128x128 as per training)
        processed = preprocess_image(image_bytes, target_size=(128, 128))
        prediction = model.predict(processed, verbose=0)
        ai_score = float(prediction[0][0])

        result = {
            "ai_score": round(ai_score, 4),
            "ai_generated": ai_score > 0.5,
            "confidence": round(abs(ai_score - 0.5) * 200, 2)  # Percentage confidence
        }

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
