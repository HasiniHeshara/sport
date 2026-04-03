import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import "./OrganizerParticipantChat.css";

const socket = io("http://localhost:5000");

export default function OrganizerParticipantChats() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const organizerId = user?.id || user?._id;

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const bottomRef = useRef(null);

  const fetchChats = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/tournament-chats/organizer/chats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setChats(res.data);
    } catch (error) {
      setMsg("Failed to load chats");
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/tournament-chats/organizer/chats/${chatId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessages(res.data);
      fetchChats();
    } catch (error) {
      setMsg("Failed to load messages");
    }
  };

  useEffect(() => {
    fetchChats();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!organizerId) return;

    socket.emit("join_organizer_room", organizerId);

    const handleUnreadChanged = () => {
      fetchChats();
    };

    socket.on("organizer_unread_changed", handleUnreadChanged);

    return () => {
      socket.off("organizer_unread_changed", handleUnreadChanged);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizerId]);

  useEffect(() => {
    if (!selectedChat?._id) return;

    loadMessages(selectedChat._id);
    socket.emit("join_tournament_chat", selectedChat._id);

    const handleNewMessage = (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      fetchChats();
    };

    socket.on("new_tournament_message", handleNewMessage);

    return () => {
      socket.off("new_tournament_message", handleNewMessage);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedChat) return;

    try {
      await axios.post(
        `http://localhost:5000/api/tournament-chats/organizer/chats/${selectedChat._id}/messages`,
        { text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
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
    <div className="organizer-chat-page">
      <div className="chat-sidebar">
        <h3>Participant Chats</h3>

        {chats.length === 0 ? (
          <div className="empty-chat">No participant chats yet</div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat._id}
              className={`chat-user ${
                selectedChat?._id === chat._id ? "active-chat" : ""
              }`}
              onClick={() => setSelectedChat(chat)}
            >
              <div className="chat-user-top">
                <strong>{chat.participantId?.name}</strong>
                {chat.unreadCount > 0 && (
                  <span className="unread-badge">{chat.unreadCount}</span>
                )}
              </div>

              <p>{chat.tournamentId?.title}</p>
              <small>{chat.lastMessage}</small>
            </div>
          ))
        )}
      </div>

      <div className="chat-main">
        {selectedChat ? (
          <>
            <div className="chat-main-head">
              <h3>{selectedChat.participantId?.name}</h3>
              <p>{selectedChat.tournamentId?.title}</p>
            </div>

            {msg && <div className="chat-organizer-msg">{msg}</div>}

            <div className="chat-main-messages">
              {messages.map((m) => (
                <div
                  key={m._id}
                  className={`message ${
                    m.senderType === "organizer" ? "my-message" : "user-message"
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
                placeholder="Reply to participant..."
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="empty-chat">Select a participant chat</div>
        )}
      </div>
    </div>
  );
}