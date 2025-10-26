#!/bin/bash

echo "🚀 Starting DeepDetector Services..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup first:"
    echo "   python -m venv venv"
    echo "   source venv/bin/activate"
    echo "   pip install -r requirements.txt"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ Node modules not found. Please run: npm install"
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  Warning: MongoDB doesn't appear to be running"
    echo "   Start it with: brew services start mongodb-community (Mac)"
    echo "   or: sudo systemctl start mongod (Linux)"
    echo ""
fi

# Create uploads directory
mkdir -p uploads

echo "✅ Starting Flask ML Service (Port 5001)..."
source venv/bin/activate
python app.py > flask.log 2>&1 &
FLASK_PID=$!
echo "   Flask PID: $FLASK_PID"

# Wait for Flask to start
sleep 3

echo "✅ Starting Express Backend (Port 5000)..."
node server-unified.js > express.log 2>&1 &
EXPRESS_PID=$!
echo "   Express PID: $EXPRESS_PID"

echo ""
echo "🎉 DeepDetector is running!"
echo ""
echo "📍 Frontend:      http://localhost:5000"
echo "📍 Scanner:       http://localhost:5000/scanner-enhanced"
echo "📍 Vault:         http://localhost:5000/vault"
echo ""
echo "📊 Flask logs:    tail -f flask.log"
echo "📊 Express logs:  tail -f express.log"
echo ""
echo "⏹️  To stop services:"
echo "   kill $FLASK_PID $EXPRESS_PID"
echo ""
echo "   Or: pkill -f 'python app.py' && pkill -f 'node server-unified.js'"
echo ""

# Save PIDs to file for easy cleanup
echo "$FLASK_PID" > .pids
echo "$EXPRESS_PID" >> .pids

# Wait for user interrupt
trap "echo ''; echo '⏹️  Shutting down...'; kill $FLASK_PID $EXPRESS_PID 2>/dev/null; rm -f .pids; exit 0" INT

wait
