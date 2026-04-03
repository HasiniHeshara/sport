import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import "./AdminChatManage.css";

const socket = io("http://localhost:5000");
const ADMIN_KEY = "adminchat123";

export default function AdminChatManage() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (!selectedChat?._id) return;

    loadMessages(selectedChat._id);
    socket.emit("join_chat", selectedChat._id);

    const handler = (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    };

    socket.on("new_message", handler);

    return () => {
      socket.off("new_message", handler);
    };
  }, [selectedChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/chats/admin/all", {
        headers: {
          "x-admin-key": ADMIN_KEY,
        },
      });
      setChats(res.data);
    } catch (error) {
      setMsg("Failed to load chats");
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/chats/admin/${chatId}/messages`, {
        headers: {
          "x-admin-key": ADMIN_KEY,
        },
      });
      setMessages(res.data);
    } catch (error) {
      setMsg("Failed to load messages");
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedChat) return;

    try {
      await axios.post(
        `http://localhost:5000/api/chats/admin/${selectedChat._id}/messages`,
        { text },
        {
          headers: {
            "x-admin-key": ADMIN_KEY,
          },
        }
      );
      setText("");
      fetchChats();
    } catch (error) {
      setMsg("Failed to send message");
    }
  };

  return (
    <div className="admin-chat-page">
      <div className="chat-sidebar">
        <h3>User Chats</h3>

        {chats.map((chat) => (
          <div
            key={chat._id}
            className={`chat-user ${selectedChat?._id === chat._id ? "active-chat" : ""}`}
            onClick={() => setSelectedChat(chat)}
          >
            <strong>{chat.userId?.name}</strong>
            <p>{chat.userId?.email}</p>
            <small>{chat.lastMessage}</small>
          </div>
        ))}
      </div>

      <div className="chat-main">
        {selectedChat ? (
          <>
            <div className="chat-main-head">
              <h3>{selectedChat.userId?.name}</h3>
              <p>{selectedChat.userId?.itNumber}</p>
            </div>

            {msg && <div className="chat-admin-msg">{msg}</div>}

            <div className="chat-main-messages">
              {messages.map((m) => (
                <div
                  key={m._id}
                  className={`message ${m.senderType === "admin" ? "my-message" : "user-message"}`}
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
                placeholder="Reply to user..."
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="empty-chat">Select a user chat</div>
        )}
      </div>
    </div>
  );
}