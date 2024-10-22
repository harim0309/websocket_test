"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";

export default function Home() {
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState(null);
  const [chatRooms, setChatRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState("");

  // 로그인
  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:3001/api/login", {
        username: username,
      });

      setUserId(response.data.userId);
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  const fetchChatRooms = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`http://localhost:3001/api/rooms/${userId}`);
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
    if (!newRoomName || !userId) return;
    try {
      const response = await axios.post("http://localhost:3001/api/rooms", {
        roomName: newRoomName,
        userId,
      });

      if (response.status === 200) {
        setNewRoomName("");
        fetchChatRooms();
      }
    } catch (error) {
      console.error("Error adding room:", error);
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, [userId]);

  console.log("chatRooms :", chatRooms);

  return (
    <div className="flex flex-col h-screen p-5">
      <h1 className="mb-5 text-center">Chat Rooms</h1>
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
                <Link href={`/chat/${room.id}`}>Chat Room {room.id}</Link>
              </li>
            ))}
          </ul>
          <div>
            <input
              type="text"
              placeholder="New Room Name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="text-gray-800"
            />
            <button onClick={handleAddRoom}>Add Room</button>
          </div>
        </>
      )}
    </div>
  );
}
