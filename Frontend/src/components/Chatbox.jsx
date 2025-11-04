import React, { useState, useRef, useEffect } from "react";
import "./Chatbot.css";

const Chatbox = () => {
  const [showChat, setShowChat] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const chatMessagesRef = useRef(null);
  const volumeCanvasRef = useRef(null);
  const isRecordingRef = useRef(false);

  // Gemini API configuration
  const GEMINI_API_KEY = "AIzaSyB8Fc-sPpmuY0cg4CcZgyhpCywmbOH754I";
  const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

  // Refs for audio/speech
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const volumeAnimationRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const transcriptRef = useRef("");
  const restartTimeoutRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const lastResultTimeRef = useRef(0);

  const toggleChatbot = () => {
    setShowChat(!showChat);
  };

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up Chatbox component...");
      if (isRecordingRef.current) {
        stopRecording();
      }
      if (recognitionRef.current) {
        stopSpeechRecognition();
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (volumeAnimationRef.current) {
        cancelAnimationFrame(volumeAnimationRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Test speech recognition support on component mount
  useEffect(() => {
    const testSpeechRecognition = () => {
      console.log("🔍 Testing speech recognition support...");
      
      if ("webkitSpeechRecognition" in window) {
        console.log("✅ webkitSpeechRecognition supported");
      } else if ("SpeechRecognition" in window) {
        console.log("✅ SpeechRecognition supported");
      } else {
        console.log("❌ Speech recognition not supported");
      }
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log("✅ getUserMedia supported");
      } else {
        console.log("❌ getUserMedia not supported");
      }
      
      if (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        console.log("✅ Secure context available for speech recognition");
      } else {
        console.log("❌ Speech recognition requires HTTPS or localhost");
      }
      
      console.log("🌐 User Agent:", navigator.userAgent);
    };
    
    testSpeechRecognition();
  }, []);

  const addMessage = (sender, text) => {
    const newMsg = { sender, text, timestamp: new Date().toLocaleTimeString() };
    setMessages((prev) => [...prev, newMsg]);
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    addMessage("user", inputValue);
    const userText = inputValue;
    setInputValue("");
    
    try {
      const botReply = await getBotResponse(userText);
      addMessage("bot", botReply);
    } catch (error) {
      addMessage("bot", "Sorry, there was an error processing your message.");
    }
  };

  const getBotResponse = async (userText) => {
    try {
      const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ 
              text: userText 
            }]
          }],
          generationConfig: {
            maxOutputTokens: 512,
            temperature: 0.7,
            topP: 0.9
          }
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text.trim();
      } else {
        return "No response from the model.";
      }
    } catch (error) {
      console.error("Error in getBotResponse:", error);
      throw error;
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Audio recording not supported in this browser.");
      return;
    }
    
    try {
      console.log("🎤 Requesting microphone access...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });
      
      console.log("✅ Microphone access granted");
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      transcriptRef.current = "";
      isSpeakingRef.current = false;
      lastResultTimeRef.current = 0;
      
      // Start volume meter
      startVolumeMeter(stream);
      
      // Start speech recognition
      startSpeechRecognition();
      
      console.log("🎤 Recording started successfully");
      
    } catch (err) {
      console.error("❌ Error starting recording:", err);
      
      if (err.name === 'NotAllowedError') {
        alert("Microphone permission denied. Please allow microphone access in your browser settings and try again.");
      } else if (err.name === 'NotFoundError') {
        alert("No microphone found. Please check your microphone connection.");
      } else {
        alert("Could not access microphone: " + err.message);
      }
    }
  };

  const stopRecording = () => {
    console.log("🛑 Stopping recording...");
    setIsRecording(false);
    isRecordingRef.current = false;
    
    // Clear restart timeout
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    // Stop speech recognition
    stopSpeechRecognition();
    
    // Stop volume meter
    stopVolumeMeter();
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error("Error stopping media recorder:", err);
      }
    }
    
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (err) {
          console.error("Error stopping track:", err);
        }
      });
      streamRef.current = null;
    }
    
    console.log("✅ Recording stopped successfully");
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      await startRecording();
    } else {
      stopRecording();
    }
  };

  const startSpeechRecognition = () => {
    // Check for speech recognition support
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.error("Speech recognition not supported");
      alert("Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }
    
    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.log("Previous recognition cleanup");
      }
      recognitionRef.current = null;
    }
    
    // Clear any pending restart
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // CRITICAL: Use non-continuous mode for better reliability
      recognition.continuous = false;  // Changed from true
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        console.log("🎤 Speech recognition started");
      };
      
      recognition.onresult = (event) => {
        if (!isRecordingRef.current) return;
        
        lastResultTimeRef.current = Date.now();
        let interimTranscript = "";
        let finalTranscript = "";
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
            transcriptRef.current += transcript + " ";
            console.log("✅ Final transcript:", transcript, "Confidence:", confidence);
          } else {
            interimTranscript += transcript;
            console.log("📝 Interim:", transcript);
          }
        }
        
        const fullText = (transcriptRef.current + interimTranscript).trim();
        setInputValue(fullText);
      };
      
      recognition.onerror = (event) => {
        console.error("❌ Speech recognition error:", event.error);
        
        // Don't treat no-speech as a critical error
        if (event.error === "no-speech") {
          console.log("⚠️ No speech detected, will restart");
          return;
        }
        
        switch (event.error) {
          case "not-allowed":
            alert("Microphone permission denied. Please allow microphone access.");
            stopRecording();
            break;
          case "audio-capture":
            console.log("⚠️ Audio capture issue, trying to continue...");
            break;
          case "network":
            console.log("⚠️ Network error, will retry");
            break;
          case "aborted":
            console.log("Recognition aborted");
            break;
          case "service-not-allowed":
            alert("Speech recognition service not allowed.");
            stopRecording();
            break;
          default:
            console.log("Speech error:", event.error);
        }
      };
      
      recognition.onend = () => {
        console.log("🔄 Speech recognition ended");
        
        // Only restart if still recording
        if (isRecordingRef.current) {
          // Wait a bit before restarting to allow processing
          const timeSinceLastResult = Date.now() - lastResultTimeRef.current;
          const delay = timeSinceLastResult < 2000 ? 500 : 100;
          
          console.log(`🔄 Restarting in ${delay}ms...`);
          restartTimeoutRef.current = setTimeout(() => {
            if (isRecordingRef.current) {
              startSpeechRecognition();
            }
          }, delay);
        }
      };
      
      recognition.onspeechstart = () => {
        console.log("🗣️ Speech detected!");
        isSpeakingRef.current = true;
      };
      
      recognition.onspeechend = () => {
        console.log("🤫 Speech ended");
        isSpeakingRef.current = false;
      };
      
      recognition.onaudiostart = () => {
        console.log("🎵 Audio capturing started");
      };
      
      recognition.onaudioend = () => {
        console.log("🔇 Audio capturing ended");
      };
      
      recognition.onsoundstart = () => {
        console.log("🔊 Sound detected");
      };
      
      recognition.onsoundend = () => {
        console.log("🔕 Sound ended");
      };
      
      // Store and start recognition
      recognitionRef.current = recognition;
      recognition.start();
      console.log("✅ Speech recognition initialized");
      
    } catch (err) {
      console.error("❌ Error initializing speech recognition:", err);
      alert("Could not start voice recognition: " + err.message);
    }
  };

  const stopSpeechRecognition = () => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    if (recognitionRef.current) {
      try {
        const recognition = recognitionRef.current;
        recognitionRef.current = null;
        
        // Remove all event handlers
        recognition.onstart = null;
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onresult = null;
        recognition.onspeechstart = null;
        recognition.onspeechend = null;
        recognition.onaudiostart = null;
        recognition.onaudioend = null;
        recognition.onsoundstart = null;
        recognition.onsoundend = null;
        
        recognition.abort();
        console.log("🛑 Speech recognition stopped");
      } catch (err) {
        console.error("Error stopping recognition:", err);
      }
    }
  };

  const startVolumeMeter = (stream) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      animateMeter();
      console.log("📊 Volume meter started");
    } catch (err) {
      console.error("Error starting volume meter:", err);
    }
  };

  const animateMeter = () => {
    if (!isRecordingRef.current) return;
    
    const canvas = volumeCanvasRef.current;
    if (!canvas || !analyserRef.current) return;
    
    const ctx = canvas.getContext("2d");
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(1, '#e9ecef');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    
    // Draw frequency bars
    const barCount = Math.min(32, dataArray.length);
    const barWidth = (canvas.width - (barCount - 1)) / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * dataArray.length);
      const barHeight = Math.max(2, (dataArray[dataIndex] / 255) * canvas.height * 0.8);
      const x = i * (barWidth + 1);
      
      const intensity = dataArray[dataIndex] / 255;
      const red = Math.min(255, 100 + intensity * 155);
      const green = Math.min(255, 200 - intensity * 100);
      const blue = Math.min(255, 50 + intensity * 50);
      
      const barGradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
      barGradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0.8)`);
      barGradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 1)`);
      
      ctx.fillStyle = barGradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      
      ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.3})`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, Math.max(1, barHeight * 0.1));
    }
    
    // Draw volume level indicator
    const volumeLevel = average / 255;
    ctx.fillStyle = volumeLevel > 0.1 ? '#4ade80' : '#94a3b8';
    ctx.fillRect(canvas.width - 60, 5, 50, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(canvas.width - 58, 7, 46 * volumeLevel, 4);
    
    volumeAnimationRef.current = requestAnimationFrame(animateMeter);
  };

  const stopVolumeMeter = () => {
    if (volumeAnimationRef.current) {
      cancelAnimationFrame(volumeAnimationRef.current);
      volumeAnimationRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    console.log("📊 Volume meter stopped");
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) {
      alert("Speech Synthesis not supported in this browser.");
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  };

  const triggerFileDialog = (mode) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.style.display = "none";
    fileInput.accept = mode === "image" ? "image/*" : "*/*";
    fileInput.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        addMessage("user", `Uploaded file: ${file.name}`);
      }
    };
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  };

  return (
    <div>
      <div className="chat-toggle-btn" onClick={toggleChatbot}>
        <img src="https://png.pngtree.com/png-clipart/20230401/original/pngtree-smart-chatbot-cartoon-clipart-png-image_9015126.png" alt="Chat" />
      </div>

      {showChat && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>Chatbot</span>
            <button className="close-btn" onClick={toggleChatbot}>
              X
            </button>
          </div>

          {isRecording && (
            <div className="volume-meter-container">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: isSpeakingRef.current ? '#4ade80' : '#ff4444',
                    animation: 'blink 1s infinite'
                  }}></div>
                  <span style={{ fontSize: '13px', color: '#333', fontWeight: '600' }}>
                    {isSpeakingRef.current ? '🗣️ Speaking...' : '🎤 Listening...'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  {recognitionRef.current ? '✅ Ready' : '⏳ Starting...'}
                </div>
              </div>
              <canvas 
                ref={volumeCanvasRef} 
                width="350" 
                height="60" 
                style={{
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
                  borderRadius: '8px',
                  border: '2px solid #dee2e6'
                }}
              ></canvas>
              <div style={{ 
                fontSize: '10px', 
                color: '#666', 
                marginTop: '5px',
                textAlign: 'center'
              }}>
                Speak clearly and pause briefly between sentences
              </div>
            </div>
          )}

          <div className="chat-messages" ref={chatMessagesRef}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`message-bubble ${
                  msg.sender === "bot" ? "bot-message" : "user-message"
                }`}
              >
                {msg.text}
                <br />
                <span className="message-timestamp">{msg.timestamp}</span>
                {msg.sender === "bot" && (
                  <div className="bot-actions">
                    <button onClick={() => speakText(msg.text)}>Speak</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="chat-input-area">
            <div className="input-buttons">
              <button className="icon-btn" onClick={() => triggerFileDialog("any")}>
                <img
                  src="https://static.vecteezy.com/system/resources/previews/004/588/642/non_2x/attach-paper-clip-thin-line-flat-color-icon-linear-illustration-pictogram-isolated-on-white-background-colorful-long-shadow-design-free-vector.jpg"
                  alt="Attach"
                />
              </button>
              <button className="icon-btn" onClick={() => triggerFileDialog("image")}>
                <img
                  src="https://static.vecteezy.com/system/resources/previews/000/593/600/original/camera-icon-logo-template-illustration-design-vector-eps-10.jpg"
                  alt="Camera"
                />
              </button>
              <button 
                className="icon-btn" 
                onClick={toggleRecording}
                style={{
                  background: isRecording ? 'linear-gradient(135deg, #ff4444 0%, #ff6b6b 100%)' : undefined,
                  borderColor: isRecording ? '#ff4444' : undefined,
                  transform: isRecording ? 'scale(1.1)' : undefined
                }}
              >
                <img
                  src="https://static.vecteezy.com/system/resources/previews/012/750/893/original/microphone-silhouette-icon-voice-record-simbol-audio-mic-logo-vector.jpg"
                  alt="Mic"
                  style={{ filter: isRecording ? 'brightness(0) invert(1)' : undefined }}
                />
              </button>
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isRecording ? "🎤 Speak now..." : "Type your message or click mic to speak..."}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              style={{
                borderColor: isRecording ? '#ff6b35' : '#e2e8f0',
                background: isRecording ? '#fff5f0' : '#f8f9fa'
              }}
            />
            <button className="send-btn" onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbox;