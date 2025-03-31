# **Rock-Paper-Scissors Detection using YOLOv12**
---

This project trains a YOLOv12-based object detection model for recognizing rock, paper, and scissors hand gestures. It involves dataset downloading, model training, quantization, and deployment to TensorFlow.js for web-based inference.

# **📌 Project Overview**
---

- ✅ **Dataset**: Rock-Paper-Scissors dataset from **Roboflow**
- ✅ **Model**: YOLOv12 for object detection
- ✅ **Training**: Ultralytics YOLO framework
- ✅ **Optimization**:  TensorFlow Lite Float16 quantization
- ✅ **Deployment**: Conversion to TensorFlow.js for browser-based inference

# **Table of Content**
---
1. [Setup](#setup)
2. [Dataset Acquisition](#dataset-acquisition)
3. [Model Training](#model-training)
4. [Model Conversion & Quantization](#model-conversion--quantization)
5. [Deployment to TensorFlow.js](#deployment-to-tensorflowjs)
6. [Key Features & Future Improvements](#key-features--future-improvements)

---
# **Setup**

## 📥 Step 1: Install Dependencies

Ensure you have all the required libraries installed:
```py
!pip install roboflow tensorflowjs ultralytics
```

# **Dataset Acquisition**

## 📥 Step 2: Download Dataset from Roboflow

The dataset is fetched using the Roboflow API.</br>
Download the Rock-Paper-Scissors dataset using the Roboflow API. Replace "YOUR_API_KEY" with your actual API key.

```py 
from roboflow import Roboflow
rf = Roboflow(api_key="YOUR_API_KEY") # Generare API kEY from roboflow website
project = rf.workspace("roboflow-58fyf").project("rock-paper-scissors-sxsw")
version = project.version(14)
dataset = version.download("yolov12")
```

---
# **Model Training**

## 🚀 Step 3: Clone YOLO Repository & Setup Training

Clone the Ultralytics YOLO repository and navigate to the folder.

```py
!git clone https://github.com/ultralytics/ultralytics.git
%cd ultralytics
```

Ensure that the YOLOv12 configuration matches the number of classes in your dataset:

```py
# import yaml
with open("/content/rock-paper-scissors-14/data.yaml", 'r') as stream:
          num_classes=str(yaml.safe_load(stream)['nc'])
print(num_classes)
```

---

## 📊 Step 4: Train YOLOv12 Model

Use DetectionTrainer to train the model on the dataset.

```py
from ultralytics.models.yolo.detect import DetectionTrainer

args = dict(
    model="yolo12n.pt",  
    data="/content/rock-paper-scissors-14/data.yaml",  
    epochs=20,  
    imgsz=416,  # Set the desired size
    task='detect'  
)
trainer = DetectionTrainer(overrides=args)
trainer.train()
```

**After training, visualize results:**

```py
import cv2
import matplotlib.pyplot as plt

img_path = "/content/ultralytics/runs/detect/train/results.png"
img = cv2.imread(img_path)
img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

plt.figure(figsize=(10, 6))
plt.imshow(img)
plt.axis("off")
plt.title("YOLO Training Results")
plt.show()

```

<details>
    <summary>visualize</summary>
    <img src='models\images\image1.png'/>
    <img src='models\images\image2.png'/>
    <img src='models\images\image3.png'/>
    <img src='models\images\image4.png'/>
</details>

---
# **Model Conversion & Quantization**

## 🔄 Step 5: Export Model & Apply Quantization

Convert the trained model to TensorFlow SavedModel format and apply Float16 quantization using TensorFlow Lite. ( **For TFlite model** )

```py
from ultralytics import YOLO
import tensorflow as tf

# Convert to SavedModel
model = YOLO('/best.pt')
model.export(format='saved_model')

# Apply Float16 Quantization
converter = tf.lite.TFLiteConverter.from_saved_model('/content/best_saved_model')
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float16]
tflite_quant_model = converter.convert()

# Save Quantized Model
with open('/content/quantized.tflite', 'wb') as f:
    f.write(tflite_quant_model)
```

---
# **Deployment to TensorFlow.js**

## 🌐 Step 6: Convert Model to TensorFlow.js for Web Deployment

To run inference in a web browser, convert the SavedModel to TensorFlow.js format. ( **For Web model** )

```py
tensorflowjs_converter --input_format=tf_saved_model \
  --quantization_bytes=2 \
  /content/best_saved_model \
  /content/web_model
```

This will generate a web-compatible model inside /content/rock-paper-scissors-best-2_web_model/.

# **Key Features & Future Improvements**

## 📌 Key Features

✔ Uses YOLOv12 for fast real-time detection </br>
✔ Robust dataset from Roboflow </br>
✔ Quantized (Float16) to optimize for mobile & web </br>
✔ Deployed as a TensorFlow.js model for web inference

## 📢 Future Improvements

🔹 Optimize for Edge Devices: Apply INT8 quantization for further size reduction. </br>
🔹 Web App Integration: Develop a web-based interface for real-time detection. </br>
🔹 Train on Custom Data: Extend the dataset with additional gestures.

# **📜 License**
This project is open-source under the MIT License. Feel free to modify and contribute! 🚀

Would you like help with deploying the TensorFlow.js model into a simple web app? 😃