from ultralytics import YOLO
from flask import Flask, request, jsonify
from PIL import Image
import os
app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False
MODEL_PATH = "model/rock-paper-scissors-best.pt"
model = YOLO(MODEL_PATH)
@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'err': 'No image file provided'}), 400
    image_file = request.files['image']
    try:
        img = Image.open(image_file.stream).convert('RGB')
    except Exception as e:
        return jsonify({'error': f'Failed to process image: {str(e)}'}), 400
    results = model(img)
    if results and results[0].boxes is not None and len(results[0].boxes) > 0:
        class_idx = int(results[0].boxes[0].cls.item()) 
        predicted_class = results[0].names[class_idx]   
        return jsonify({'result': predicted_class}), 200
    else:
        return jsonify({'result': 'none'}), 200

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'OK'}), 200
    
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
