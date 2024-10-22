"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { Cookies } from "react-cookie";

export default function Home() {
  const cookies = new Cookies();
  // 사용자 이름
  const [username, setUsername] = useState("");
  // 사용자 ID
  const [userId, setUserId] = useState("");
  // 채팅방 목록
  const [chatRooms, setChatRooms] = useState([]);
  // 대화할 상대
  const [targetUserIdsInput, setTargetUserIdsInput] = useState("");
  const [targetUserIds, setTargetUserIds] = useState([]);

  // 로그인
  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `http://${location.hostname}:3001/api/login`,
        {
          username: username,
        }
      );

      setUserId(response.data.userId);
      cookies.set("userId", response.data.userId, { path: "/" });
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  const fetchChatRooms = async () => {
    if (!userId) return;
    try {
      const response = await fetch(
        `http://${location.hostname}:3001/api/rooms/${userId}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const rooms = await response.json();
      setChatRooms(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  // 채팅방 추가
  const handleAddRoom = async () => {
    if (!userId || targetUserIds.length === 0) return;
    try {
      const response = await axios.post(
        `http://${location.hostname}:3001/api/rooms`,
        {
          userId,
          targetUserIds,
        }
      );

      if (response.status === 200) {
        setTargetUserIds([]);
        setTargetUserIdsInput("");
        fetchChatRooms(); // 새로 추가된 방 목록 갱신
      }
    } catch (error) {
      console.error("Error adding room:", error);
    }
  };

  // 사용자 입력 처리: 쉼표로 구분된 ID를 배열로 변환
  const handleTargetUserIdsChange = (e) => {
    setTargetUserIdsInput(e.target.value);
    const ids = e.target.value.split(",").map((id) => id.trim());
    setTargetUserIds(ids);
  };

  useEffect(() => {
    const userIdCookie = cookies.get("userId");
    setUserId(userIdCookie);
  }, []);

  useEffect(() => {
    fetchChatRooms();
  }, [userId]);

  // WebSocket을 통해 새 채팅방 생성 이벤트 수신
  useEffect(() => {
    const ws = new WebSocket(`ws://${location.hostname}:8080/chatrooms`);

    ws.onmessage = (event) => {
      const receivedMessage = JSON.parse(event.data);

      if (receivedMessage.type === "NEW_CHAT_ROOM") {
        // 새 채팅방을 chatRooms 상태에 추가
        setChatRooms((prevRooms) => [
          ...prevRooms,
          { id: receivedMessage.roomId, name: receivedMessage.roomName },
        ]);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="flex flex-col h-screen p-5">
      <h1 className="mb-5 text-center">Chat Rooms</h1>
      <h1 className="mb-5 text-right">My ID : {userId}</h1>
      {!userId ? (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="text-gray-800"
          />
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <>
          <ul className="flex-1 pl-5 list-disc">
            {chatRooms.map((room) => (
              <li key={room.id}>
                <Link href={`/chat/${room.id}`}>
                  Chat Room With : [{room.room_name}]
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="New Room Name"
              value={targetUserIdsInput}
              onChange={handleTargetUserIdsChange}
              className="flex-1 p-2 text-gray-800 rounded"
            />
            <button
              onClick={handleAddRoom}
              className="w-10 h-10 border border-gray-50 rounded-3xl"
            >
              +
            </button>
          </div>
        </>
      )}
    </div>
  );
}
