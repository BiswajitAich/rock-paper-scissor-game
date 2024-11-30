from ultralytics import YOLO
from flask import Flask, request, jsonify
from PIL import Image
import os
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
MODEL_PATH = "model/rock-paper-scissors-best-4-int8.tflite"
model = None
@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'err': 'No image file provided'}), 400
    image_file = request.files['image']
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    if not image_file.filename.lower().split('.')[-1] in allowed_extensions:
        return jsonify({'error': 'Invalid file type'}), 400
    try:
        img = Image.open(image_file.stream).convert('RGB')
        img = img.resize((64, 64))
    except Exception as e:
        return jsonify({'error': f'Failed to process image---: {str(e)}'}), 400
    try:
        results = model(img, imgsz=64)
        if results and results[0].boxes is not None and len(results[0].boxes) > 0:
            class_idx = int(results[0].boxes[0].cls.item()) 
            predicted_class = results[0].names[class_idx]   
            return jsonify({'result': predicted_class}), 200
        else:
            return jsonify({'result': 'none'}), 200
    except Exception as e:
        return jsonify({'error': f'YOLO inference failed: {str(e)}'}), 500

def load_model():
    global model
    model = YOLO(MODEL_PATH)


load_model()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'OK'}), 200
    
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
