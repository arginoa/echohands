
![Status](https://img.shields.io/badge/status-in%20development-yellow)
![Built with React](https://img.shields.io/badge/built%20with-React-blue)
![Built with TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-Enabled-orange)

# ✋ EchoHands: ASL Typing Powered by AI  
[🌐 Live Website](https://echohands.kmahin.co/)

---

## 📘 What is ASL?

**ASL (American Sign Language)** is a complete, natural language that serves as the predominant sign language of the Deaf community in the United States and parts of Canada. Instead of using spoken words, ASL uses a combination of hand gestures, facial expressions, and body language to convey meaning. Each letter of the alphabet has a corresponding hand sign, allowing for fingerspelling words and names.

---

## 🧠 What is EchoHands?

**EchoHands** is an interactive AI-powered typing game that lets users practice American Sign Language by recognizing hand gestures in real-time using their webcam. The app leverages **computer vision** and **deep learning** to interpret ASL fingerspelling and match it against falling letters on the screen — combining education with a fun, gamified experience.

---

## 🎮 Tutorial – How to Play

1. **Allow Webcam Access**  
   When the app starts, it asks for permission to access your camera — grant it to allow gesture recognition.

2. **Learn the ASL Alphabet**  
   Use the ❓ help button (bottom-right corner) to open the **Help Room**, which includes an ASL alphabet visual guide and tips.

3. **Start Typing in ASL!**  
   Random letters will fall from the top of the screen. Use your hands to sign the correct ASL letter.  
   If your sign matches a falling letter, it disappears and your score increases.

4. **Red Letters = Danger!**  
   Don’t miss any letters — and be careful of red ones!

5. **Track Your Score**  
   After the game ends, your high score is saved in your browser. You can always play again!

---

## 🧪 Technical Description

### ✋ Hand Detection with Google Mediapipe  
This project uses **Google Mediapipe's HandLandmarker** to detect key landmarks on the user's hand in real-time through the webcam. It returns 21 key points for each detected hand, which are then processed to extract a gesture signature.

### 🧠 Model Inference with ONNX.js  
The gesture signature is passed into a **pretrained ASL classifier model** converted to **ONNX (Open Neural Network Exchange)** format. The ONNX model is run client-side using **ONNX.js**, allowing real-time ASL letter prediction entirely in the browser — no server required.

### 🤖 AI Model Training  
The ASL model was created using **Google Colab**, trained on labeled landmark data corresponding to different ASL letters (excluding 'j' and 'z' due to their motion complexity).

### 💬 Generative AI for Help & Guidance  
The in-app **AI Help Room** is powered by **OpenRouter** using the **Mistral Small** model. Users can ask for:
- Typing help
- ASL learning tips
- Practice strategies  
The chatbot is responsive and visually accessible with support for font and color customization.


