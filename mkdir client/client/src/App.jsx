import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5000");

function App() {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);

  const [text, setText] = useState("");
  const [users, setUsers] = useState(0);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [typing, setTyping] = useState("");
  const [notification, setNotification] = useState("");

  const [dark, setDark] = useState(true);
  const [lastEdited, setLastEdited] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    const savedText = localStorage.getItem("editorText");

    if (savedText) {
      setText(savedText);
    }

    socket.on("receive-changes", (data) => {
      setText(data);
    });

    socket.on("users-count", (count) => {
      setUsers(count);
    });

    socket.on("notification", (msg) => {
      setNotification(msg);
    });

    socket.on("typing", (msg) => {
      setTyping(msg);
    });

    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off();
    };
  }, []);

  const joinRoom = () => {
    if (!name || !room) return;

    socket.emit("join-room", {
      name,
      room,
    });

    setJoined(true);
  };

  const handleEditor = (e) => {
    const value = e.target.value;

    setText(value);

    localStorage.setItem("editorText", value);

    setLastEdited(
      new Date().toLocaleTimeString()
    );

    setSaved("Auto Saved ✅");

    socket.emit("send-changes", {
      room,
      text: value,
    });
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);

    socket.emit("typing", {
      room,
      name,
    });

    setTimeout(() => {
      socket.emit("stop-typing", room);
    }, 1000);
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    const data = {
      room,
      name,
      msg: message,
      time: new Date().toLocaleTimeString(),
    };

    socket.emit("send-message", data);

    setMessage("");
  };

  const copyText = () => {
    navigator.clipboard.writeText(text);
    alert("Copied");
  };

  const clearText = () => {
    setText("");
    localStorage.removeItem("editorText");
  };

  const downloadText = () => {
    const blob = new Blob([text], {
      type: "text/plain",
    });

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = "editor.txt";
    a.click();
  };

  const addEmoji = (emoji) => {
    setMessage(message + emoji);
  };

  const wordCount =
    text.trim() === ""
      ? 0
      : text.trim().split(/\s+/).length;

  const charCount = text.length;

  if (!joined) {
    return (
      <div className="join-page">
        <div className="join-box">
          <h1>Realtime Collaborative Editor</h1>

          <input
            placeholder="Enter Name"
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <input
            placeholder="Enter Room"
            onChange={(e) =>
              setRoom(e.target.value)
            }
          />

          <button onClick={joinRoom}>
            Join Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{
        background: dark ? "#000" : "#f5f5f5",
        color: dark ? "#fff" : "#000",
      }}
    >
      <div className="editor-section">
        <button
          className="themeBtn"
          onClick={() => setDark(!dark)}
        >
          {dark ? "☀ Light" : "🌙 Dark"}
        </button>

        <h2>Room: {room}</h2>

        <h3>Online Users: {users}</h3>

        <p className="note">{notification}</p>

        <textarea
          value={text}
          onChange={handleEditor}
          placeholder="Start typing..."
        />

        <div className="controls">
          <button onClick={copyText}>
            Copy
          </button>

          <button onClick={clearText}>
            Clear
          </button>

          <button onClick={downloadText}>
            Download
          </button>
        </div>

        <div className="stats">
          <p>Words: {wordCount}</p>
          <p>Characters: {charCount}</p>
          <p>Last Edited: {lastEdited}</p>
          <p>{saved}</p>
        </div>
      </div>

      <div className="chat-section">
        <h2>Chat 💬</h2>

        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className="msg">
              <b>{m.name}</b>
              <span> ({m.time})</span>
              <p>{m.msg}</p>
            </div>
          ))}
        </div>

        <p className="typing">{typing}</p>

        <div className="emojiBar">
          <button onClick={() => addEmoji("😀")}>😀</button>
          <button onClick={() => addEmoji("😂")}>😂</button>
          <button onClick={() => addEmoji("😍")}>😍</button>
          <button onClick={() => addEmoji("👍")}>👍</button>
          <button onClick={() => addEmoji("❤️")}>❤️</button>
        </div>

        <input
          value={message}
          onChange={handleTyping}
          placeholder="Type message..."
        />

        <button onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;