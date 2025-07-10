let video = document.getElementById("video");
let canvas = document.getElementById("canvas");
let message = document.getElementById("message");
let ownerDescriptor = null;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models"),
]).then(startVideo);

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} }).then((stream) => {
    video.srcObject = stream;
  });
}

async function registerOwner() {
  const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
  if (!detections) {
    message.innerText = "❌ Face not detected. Try again.";
    return;
  }
  ownerDescriptor = detections.descriptor;
  localStorage.setItem("owner", JSON.stringify(Array.from(ownerDescriptor)));
  message.innerText = "✅ Owner registered!";
}

async function scanFace() {
  const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
  if (!detections) {
    message.innerText = "❌ No face detected.";
    return;
  }

  const stored = localStorage.getItem("owner");
  if (!stored) {
    message.innerText = "⚠️ Please register owner face first!";
    return;
  }

  const storedDescriptor = new Float32Array(JSON.parse(stored));
  const distance = faceapi.euclideanDistance(detections.descriptor, storedDescriptor);
  
  if (distance < 0.5) {
    message.innerText = "✅ Access Granted!";
  } else {
    message.innerText = "🚨 Intruder Detected!";
    takeSnapshot();
  }
}

function takeSnapshot() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  canvas.style.display = "block";

  let img = canvas.toDataURL("image/jpeg");
  let a = document.createElement("a");
  a.href = img;
  a.download = "intruder.jpg";
  a.click();
}
