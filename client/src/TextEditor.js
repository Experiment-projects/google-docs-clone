import { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

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

export default function TextEditor() {
  const { id: documentId } = useParams();
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  const [textindex, setTextindex] = useState();
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [socketStatus, setSocketStatus] = useState("Connecting...");
  useEffect(() => {
    const s = io("http://localhost:3001/");
    s.on("connect", () => {
      setSocketStatus("Connected");
    });

    s.on("disconnect", () => {
      setSocketStatus("Disconnected");
    });

  
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once("load-document", (document) => {
      quill.setContents(document);
      quill.enable();
    });

    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };
    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };

    quill.on("text-change", handler);
    quill.on('selection-change', function(range, oldRange, source) {
      if (range) {
        console.log(range,"selection")
        if (range.length == 0) {
          console.log('User cursor is on', range?.index);
          setTextindex(range?.index)
        } else {
          var text = quill.getText(range.index, range.length);
          console.log('User has highlighted', text ? text : "blank");
        }
      } else {
        console.log('Cursor not in the editor');
      }
    });

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;

    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    q.disable();
    q.setText("Loading...");
    setQuill(q);
  }, []);


  useEffect(() => {
    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      console.log("Speech to text:", speechToText.length);
      
      insertTextAtLastIndex(speechToText+"\n");
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
  }, [quill,isListening,selectedLanguage]);

  const startListening = () => {
    recognition.lang = selectedLanguage;
    setIsListening(true);
    recognition.start();
  };
  const stopListening = () => {
    setIsListening(false);
    recognition.stop();
  };





  const insertTextAtIndex = (index, text) => {
    if (index) {
    const delta = [{ retain: index }, { insert: text }];
    quill.updateContents(delta);
    socket.emit("send-changes", delta);
    }
    else insertTextAtLastIndex(text)
  };
  const getLastIndex = () => {
    const quillEditor = quill?.editor;
    if (quillEditor) {
      const length = quill.getLength();
      return length > 0 ? length - 1 : 0;
    }
    return 0;
  };
  const getIndex = () => {
    const quillEditor = quill?.editor;
    if (quillEditor) {
      const length = quill.getLength();
      return length > 0 ? length - 1 : 0;
    }
    return 0;
  };

  const insertTextAtLastIndex = (text) => {
    const lastIndex = getLastIndex();
   

    const delta = [{ retain: textindex?textindex:lastIndex }, { insert: text }];
    quill.updateContents(delta);
    setTextindex(textindex+text.length)
    socket.emit("send-changes", delta);
  };
  const handleLanguageChange = (event) => {
    setSelectedLanguage(event.target.value);
  };
  return (
    <> 
       <div className="micro-container">
       <h3 className="status-div"> {socketStatus}<div className="blink_me"></div></h3>
          {/* <button onClick={() => insertTextAtIndex(textindex, `Inserted text at index ${textindex}`)}>
            Insert Text at Index
          </button>
          <button onClick={() => insertTextAtLastIndex("Inserted text at last index")}>
            Insert Text at Last Index
          </button> */}
          <button className="btn green" onClick={startListening} disabled={isListening}>
            {isListening ? "Listening..." : "Start Dictation"}
          </button>
          
          <button className="btn red" onClick={stopListening} disabled={!isListening}>
            Stop Dictation
          </button>
          <div>
          <label htmlFor="languageDropdown">Select Language:</label>
          <select id="languageDropdown" value={selectedLanguage} onChange={handleLanguageChange}>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Spanish (Spain)</option>
            <option value="te-IN">Telugu</option>
            {/* Add more language options as needed */}
          </select>
          </div>
        
        </div>
      <div className="container-main ">
      
        <div className="container" ref={wrapperRef}></div>
     
      </div>
    </>
  );
}
