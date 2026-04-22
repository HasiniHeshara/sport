import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import "./ParticipantOrganizerChat.css";

const socket = io("http://localhost:5000");

export default function ParticipantOrganizerChat() {
  const { tournamentId } = useParams();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const bottomRef = useRef(null);

 useEffect(() => {
  if (!tournamentId || tournamentId === "undefined") {
    setMsg("Invalid tournament chat link");
    return;
  }

  createOrLoadChat();
  loadMessages();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [tournamentId]);

  useEffect(() => {
    if (!chat?._id) return;

    socket.emit("join_tournament_chat", chat._id);

    const handler = (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    };

    socket.on("new_tournament_message", handler);

    return () => {
      socket.off("new_tournament_message", handler);
    };
  }, [chat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createOrLoadChat = async () => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/tournament-chats/tournament/${tournamentId}/start`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setChat(res.data);
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
          "You can chat with organizer only after registration"
      );
    }
  };

  const loadMessages = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/tournament-chats/tournament/${tournamentId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessages(res.data);
    } catch (error) {
      setMsg("Failed to load messages");
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await axios.post(
        `http://localhost:5000/api/tournament-chats/tournament/${tournamentId}/messages`,
        { text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setText("");
    } catch (error) {
      setMsg("Failed to send message");
    }
  };

  return (
    <div className="participant-chat-page">
      <div className="participant-chat-card">
        <div className="chat-head">
          <h2>Chat with Organizer</h2>
          <p>{chat?.tournamentId?.title || "Tournament Chat"}</p>
          <small>{user?.name}</small>
        </div>

        {msg && <div className="chat-msg">{msg}</div>}

        <div className="messages-box">
          {messages.map((m) => (
            <div
              key={m._id}
              className={`message ${
                m.senderType === "participant" ? "my-message" : "organizer-message"
              }`}
            >
              <div className="message-name">{m.senderName}</div>
              <div>{m.text}</div>
            </div>
          ))}
          <div ref={bottomRef}></div>
        </div>

        <form className="chat-form" onSubmit={sendMessage}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message..."
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}