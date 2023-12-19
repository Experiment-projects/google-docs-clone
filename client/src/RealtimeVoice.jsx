import { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";


const SAVE_INTERVAL_MS = 2000;
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

export default function RealtimeEditor() {


  const [Text, setText] = useState('');
//   const [Textfort, setTextfort] = useState();

  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const speakContinuously = (texttt) => {
    const text = texttt
    console.log(text,"tts");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;      
      setText(speechToText+"\n");
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };
    recognition.lang = selectedLanguage;
  }, [isListening,selectedLanguage]);

  const startListening = () => {
    recognition.lang = selectedLanguage;
    setIsListening(true);
    recognition.start();
  };
  const stopListening = () => {
    setIsListening(false);
    recognition.stop();
  };
  const translateText = async (text) => {
    try {
        if (text) {
      const response = await fetch('https://voiceapi.aicte-india.org/text-to-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: text,
          outputLang: 'hi-IN',
        }),
      });

      if (response.ok) {
        const translatedData = await response.json();
        // speakContinuously(translatedData?.data)
        requestTtsAudio(translatedData?.data,'hi-IN-SwaraNeural')
        // setTextfort(translatedData?.data);
      } else {
        console.error('Translation failed:', response.statusText);
      }
    }else console.log('Translation text not found');
    } catch (error) {
      console.error('Translation error:', error);
    }
  };
  const requestTtsAudio = async (text, voice) => {
    try {
      const response = await fetch('https://voiceapi.aicte-india.org/text-to-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Body: text,
          language: 'hi-IN',
          voice: voice,
        }),
      });

      if (response.ok) {
        const audioData = await response.json();
        // setAudioBuffer(audioData.data.audio);
        playaudio(audioData.data.audio.data)
      } else {
        console.error('TTS request failed:', response.statusText);
      }
    } catch (error) {
      console.error('TTS request error:', error);
    }
  };
  useEffect(() => {
    
    translateText(Text)
 
  }, [Text])
  const playaudio = async (ArrayBuffer1)=>{
    console.log('Audio buffer is available',ArrayBuffer1)
    if (ArrayBuffer1) {
      const audioBlob = new Blob([new Uint8Array(ArrayBuffer1)], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioElement = new Audio(audioUrl);
      audioElement.play();
    }
  }


  
//   useEffect(() => {
//     const logSupportedLanguages = () => {
//         const voices = window.speechSynthesis.getVoices();
//         console.log('Supported Languages:');
        
//         voices.forEach((voice) => {
//           console.log(voice.lang, voice.name);
//         });
//       };
      
//       // Add an event listener for the voiceschanged event
//       window.speechSynthesis.addEventListener('voiceschanged', logSupportedLanguages);
      
//       // Log supported languages on component mount
//       logSupportedLanguages();
//   }, [])
  







  return (
    <> 
       <div className="micro-container">
   
          <button className="btn green" onClick={startListening} disabled={isListening}>
            {isListening ? "Listening..." : "Start Dictation"}
          </button>
          
          <button className="btn red" onClick={stopListening} disabled={!isListening}>
            Stop Dictation
          </button>
          <div>
          <label htmlFor="languageDropdown">Select Language:</label>
          <select id="languageDropdown" value={selectedLanguage} onChange={(e)=>setSelectedLanguage(e.target.value)}>
            <option selected value="en-US">English (US)</option>
            <option value="es-ES">Spanish (Spain)</option>
            <option value="te-IN">Telugu</option>
            {/* Add more language options as needed */}
          </select>
          </div>
        
        </div>
      <div className="container-main ">
      
        {/* <div className="container" ref={wrapperRef}></div> */}
        {Text}
     
      </div>
    </>
  );
}
