import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { OPENROUTER_KEY } from './config.js';





// Initialize global variables
let handLandmarker;
const alphabet = 'abcdefghiklmnopqrstuvwxy'; // Exclude 'j' and 'z'
const sess = new onnx.InferenceSession();
let tensor; // Reuse tensor object


// Load the ONNX model and initialize the tensor
const loadModel = async () => {
    await sess.loadModel('new4_model.onnx');
    tensor = new onnx.Tensor(new Float32Array(63), "float32", [1, 63]);
};
loadModel();


// Get reference to prediction display
const prediction = document.getElementById("predicted");

// Predict the alphabet based on hand landmarks
const predictAlphabet = async (landmarks) => {
    if (landmarks) {
        const flattenedLandmarks = landmarks.flatMap(landmark => [landmark.x, landmark.y, landmark.z]);
        tensor.data.set(flattenedLandmarks); // Update the tensor data
        const results = await sess.run([tensor]);
        const outputTensor = results.values().next().value;
        const probabilities = outputTensor.data;

        const maxIndex = probabilities.indexOf(Math.max(...probabilities));
        const predictedAlphabet = alphabet[maxIndex];
        prediction.innerHTML = `Predicted alphabet: ${predictedAlphabet}`;
        triggerHitEffect(predictedAlphabet);
    }
};

// Create and configure the hand landmarker
const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2
    });
    startWebcam();
};
createHandLandmarker();

// Start the webcam and begin frame processing
const startWebcam = () => {
    const video = document.getElementById("webcam");
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });
};

// Process frames from the webcam
const predictWebcam = () => {
    const video = document.getElementById("webcam");
    let frameCounter = 0;
    const frameLimit = 6; // Process every 6 frames

    const processFrame = async () => {
        if (handLandmarker) {
            if (frameCounter % frameLimit === 0) {
                const results = await handLandmarker.detectForVideo(video, performance.now());
                if (results.landmarks) {
                    await predictAlphabet(results.landmarks[0]);
                }
            }
            frameCounter++;
        }
        requestAnimationFrame(processFrame);
    };
    processFrame();
};

// Game-related variables and constants
const letters = 'abcdefghiklmnopqrstuvwxy'; // Exclude 'j' and 'z'
const fallingLettersDiv = document.getElementById('fallingLetters');
const scoreDisplay = document.getElementById('score');
let fallingLetters = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let fallSpeed = 100; // Initial falling speed
let spawnRate = 1500; // Time in ms between spawns
let fallSpeedIncreaseInterval = 5000; // Time in ms to increase fall speed
let lastSpeedIncreaseTime = Date.now();
let usedLetters = new Set(); // Track used letters
const redLetterProbability = 0; // Probability of a red letter

// Utility functions
const getRandomLetter = () => {
    let letter;
    do {
        letter = letters[Math.floor(Math.random() * letters.length)];
    } while (usedLetters.has(letter));
    usedLetters.add(letter);
    return letter;
};

const getRandomPosition = () => `${Math.random() * (window.innerWidth - 50)}px`; // Prevent letters from going off-screen

const getRandomSize = () => `${Math.random() * 30 + 50}px`; // Size between 50px and 80px

// Create a falling letter
const createFallingLetter = () => {
    if (fallingLetters.length >= 24) return; // Cap the number of letters on the screen

    if (usedLetters.size >= letters.length) usedLetters.clear(); // Clear used letters if all have been used

    const letter = document.createElement('div');
    letter.classList.add('fallingLetter');
    letter.textContent = getRandomLetter();
    letter.style.left = getRandomPosition();
    letter.style.top = `-50px`;
    letter.style.fontSize = getRandomSize();
    letter.style.position = 'absolute';
    letter.style.textAlign = 'center';
    letter.style.color = Math.random() < redLetterProbability ? 'red' : 'white';

    fallingLettersDiv.appendChild(letter);
    fallingLetters.push(letter);

    // Move the letter independently
    const moveLetter = () => {
        if (!letter.dataset.frozen) {
            const rect = letter.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                letter.style.top = `${rect.top + fallSpeed}px`;
                requestAnimationFrame(moveLetter);
            } else {
                if (fallingLettersDiv.contains(letter)) {
                    fallingLettersDiv.removeChild(letter);
                    fallingLetters = fallingLetters.filter(l => l !== letter);
                    usedLetters.delete(letter.textContent);
                }
                if (!letter.classList.contains('redLetter')) endGame();
            }
        }
    };

    moveLetter(); // Start the movement
};

// Trigger hit effect for the letter that matches the key
const triggerHitEffect = (key) => {
    fallingLetters.forEach((letter) => {
        if (letter.textContent === key && !letter.dataset.frozen) {
            letter.dataset.frozen = 'true'; // Freeze the letter
            letter.classList.add('hitEffect'); // Add animation class
            setTimeout(() => {
                if (fallingLettersDiv.contains(letter)) {
                    fallingLettersDiv.removeChild(letter);
                    fallingLetters = fallingLetters.filter(l => l !== letter);
                    usedLetters.delete(letter.textContent);
                    score += letter.classList.contains('redLetter') ? -1 : 1;
                    scoreDisplay.textContent = 'Score: ' + score;
                }
            }, 150); // Delay removal for visual effect
        }
    });
};

// Handle key press events
const checkKeyPress = (event) => {
    const key = event.key.toLowerCase();
    triggerHitEffect(key);
};

// Increase fall speed and letter spawning rate over time
const increaseDifficulty = () => {
    const now = Date.now();
    if (now - lastSpeedIncreaseTime > fallSpeedIncreaseInterval) {
        console.log(fallSpeed)
        fallSpeed *= 1.3; // Increase fall speed
        spawnRate = Math.max(500, spawnRate * 0.9); // Decrease spawn interval to increase spawn rate
        lastSpeedIncreaseTime = now;
    }
};

// Declare globally
let gameInterval; 

// Start the game
const startGame = () => {
    resetGame();
    document.getElementById('gameOverOverlay').style.display = 'none';
    gameInterval = setInterval(createFallingLetter, spawnRate); // Use global variable
    setInterval(() => {
        increaseDifficulty();
    }, 1000);
};

// End the game
const endGame = () => {
    clearInterval(gameInterval); // Clear the global interval
    document.getElementById('gameOverOverlay').style.display = 'flex';
    document.getElementById('finalScore').textContent = `Your Score: ${score}`;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    document.getElementById('highScore').textContent = `High Score: ${highScore}`;
};


// Reset the game state
const resetGame = () => {
    fallingLetters.forEach(letter => {
        if (fallingLettersDiv.contains(letter)) {
            fallingLettersDiv.removeChild(letter);
        }
    });
    fallingLetters = [];
    score = 0;
    scoreDisplay.textContent = 'Score: ' + score;
    fallSpeed = 100; // Reset to initial speed
    spawnRate = 1500; // Reset to initial spawn rate
    lastSpeedIncreaseTime = Date.now();
    usedLetters.clear(); // Clear used letters
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const playAgainButton = document.getElementById('playAgainButton');
    playAgainButton.addEventListener('click', startGame);
    startGame();
});




const helpBtn = document.getElementById("helpButton");
const helpModal = document.getElementById("helpModal");
const tabBtns = document.querySelectorAll(".tabBtn");
const tabContents = document.querySelectorAll(".tabContent");
const chatContainer = document.getElementById("chatContainer");
const toggleChatBtn = document.getElementById("toggleChat");
const bgSelect = document.getElementById("bgSelect");
const gameContainer = document.getElementById("gameContainer");


bgSelect.addEventListener("change", (e) => {
    const bg = e.target.value;
  
    // Reset all background classes on <body>
    document.body.classList.remove("default-bg", "cove-bg", "ziggurat-bg", "village-bg", "urban-bg", "dungeon-bg");
  
    // Apply the new background class to <body>
    document.body.classList.add(`${bg}-bg`);
  });
  
// Toggle help modal
helpBtn.addEventListener("click", () => {
  helpModal.style.display = helpModal.style.display === "flex" ? "none" : "flex";
});

// Tab switching logic
tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-tab");

    // Hide all tab content
    tabContents.forEach(tab => tab.classList.remove("active"));

    // Show selected tab
    document.getElementById(target).classList.add("active");

    // Hide chat when switching tabs
    chatContainer.style.display = "none";
    toggleChatBtn.textContent = "💬 Open Chat";
  });
});

// Chat toggle button logic
toggleChatBtn.addEventListener("click", () => {
  const isVisible = chatContainer.style.display === "block";
  chatContainer.style.display = isVisible ? "none" : "block";
  toggleChatBtn.textContent = isVisible ? "💬 Open Chat" : "❌ Close Chat";
});

// ✅ Accessibility: Font Selector
document.getElementById("fontSelect").addEventListener("change", (e) => {
  const font = e.target.value;
  document.body.style.fontFamily = font;
  document.getElementById("fallingLetters").style.fontFamily = font; // Apply to falling letters too
});


// ✅ Accessibility: Theme Selector
document.getElementById("themeSelect").addEventListener("change", (e) => {
  const theme = e.target.value;
  const chatBox = document.getElementById("chatBox");

  switch (theme) {
    case "dark":
      document.body.style.background = "#111";
      document.body.style.color = "#fff";
      chatBox.style.background = "#222";
      break;
    case "light":
      document.body.style.background = "#fff";
      document.body.style.color = "#000";
      chatBox.style.background = "#f1f1f1";
      break;
    case "high-contrast":
      document.body.style.background = "#000";
      document.body.style.color = "#FFD700";
      chatBox.style.background = "#000";
      break;
    case "blue":
      document.body.style.background = "#cce7ff";
      document.body.style.color = "#003366";
      chatBox.style.background = "#e6f2ff";
      break;
    case "sepia":
      document.body.style.background = "#f4ecd8";
      document.body.style.color = "#5b4636";
      chatBox.style.background = "#fdf6e3";
      break;
    case "pink":
      document.body.style.background = "#ffe6f0";
      document.body.style.color = "#4a0033";
      chatBox.style.background = "#fff0f5";
      break;
    default:
      document.body.style.background = "#fff";
      document.body.style.color = "#000";
      chatBox.style.background = "#f1f1f1";
  }
});

// OpenRouter Chat API (Mistral Small)
document.getElementById("sendChat").addEventListener("click", async () => {
  const userMessage = document.getElementById("chatInput").value;
  if (!userMessage) return;

  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML += `<p><b>You:</b> ${userMessage}</p>`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-small",
        messages: [{ role: "user", content: userMessage }]
      })
    });

    const result = await response.json();
    const reply = result.choices?.[0]?.message?.content || "⚠️ No response received.";
    chatBox.innerHTML += `<p><b>EchoHands:</b> ${reply}</p>`;
    document.getElementById("chatInput").value = "";
  } catch (err) {
    chatBox.innerHTML += `<p><b>Bot:</b> ❌ Error: ${err.message}</p>`;
  }

});



