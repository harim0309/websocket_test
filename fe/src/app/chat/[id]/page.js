"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export default function ChatPage({ params }) {
  const { id: roomId } = params; // roomId는 URL 파라미터에서 추출

  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [nickname, setNickname] = useState(
    `User_${Math.floor(Math.random() * 1000)}`
  );

  // 이전 메시지 불러오기
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3001/api/messages/${roomId}`
        );
        setChatLog(response.data);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };

    fetchChatHistory();

    const ws = new WebSocket(`ws://${location.hostname}:8080/chat/${roomId}`);

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    ws.onmessage = (event) => {
      const receivedMessage = JSON.parse(event.data);

      if (receivedMessage.type === "NEW_CHAT_ROOM") {
        // 새 채팅방을 chatRooms 상태에 추가
        setChatRooms((prevRooms) => [
          ...prevRooms,
          { id: receivedMessage.roomId, name: receivedMessage.roomName },
        ]);
      } else {
        // 기존의 메시지 처리
        setChatLog((prev) => [...prev, receivedMessage]);
      }
    };
    // ws.onmessage = (event) => {
    //   const receivedMessage = JSON.parse(event.data);
    //   setChatLog((prev) => [...prev, receivedMessage]);
    // };

    ws.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [roomId]);

  const sendMessage = () => {
    if (socket && message) {
      const messageData = {
        nickname,
        message,
        roomId,
      };
      socket.send(JSON.stringify(messageData));
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col h-screen p-5">
      <h1 className="mb-5 text-center">WebSocket Chat Room: {roomId}</h1>

      <div className="flex flex-col-reverse flex-1 overflow-y-auto">
        <ul className="w-full">
          {chatLog.map((msg, index) => (
            <li
              key={index}
              className={`flex items-center mb-2 ${
                msg.nickname === nickname ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg text-white ${
                  msg.nickname === nickname ? "bg-blue-500" : "bg-green-500"
                }`}
              >
                <span className="font-semibold">{msg.nickname}: </span>
                {msg.message}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex gap-4 mt-5">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 p-2 text-gray-800 rounded"
        />
        <button
          onClick={sendMessage}
          className="w-10 border border-gray-50 rounded-3xl"
        >
          ⬆︎
        </button>
      </div>
    </div>
  );
}
