"use client";

// Next.js 13+에서 "use client"를 사용하면 컴포넌트가 서버가 아닌 클라이언트 측에서 렌더링된다는 것을 명시합니다.
import { useState, useEffect } from "react";

// React 컴포넌트 정의
export default function ChatPage() {
  // socket: WebSocket 객체를 저장하는 상태
  // message: 사용자가 입력한 메시지
  // chatLog: 채팅 메시지를 저장하는 배열 (채팅 기록)
  // nickname: 각 클라이언트마다 고유한 닉네임 (간단하게 브라우저에서 자동 생성)
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [nickname, setNickname] = useState(
    `User_${Math.floor(Math.random() * 1000)}`
  );

  // useEffect: 컴포넌트가 처음 마운트되었을 때 WebSocket 연결을 설정하고, 컴포넌트가 언마운트되면 WebSocket 연결을 종료합니다.
  useEffect(() => {
    // WebSocket 연결을 localhost:8080에 설정
    // const ws = new WebSocket("ws://localhost:8080");
    // location.origin을 사용하여 현재 호스트의 URL을 자동으로 가져옴
    // WebSocket 프로토콜을 사용하고 포트를 8080으로 설정
    const ws = new WebSocket(`ws://${location.hostname}:8080/chat`);

    // WebSocket이 연결되었을 때 실행되는 코드
    ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    // WebSocket에서 서버로부터 받은 메시지를 처리하는 이벤트 핸들러
    // Blob 데이터를 문자열로 변환한 후 chatLog에 추가
    ws.onmessage = (event) => {
      const receivedMessage = JSON.parse(event.data); // JSON으로 받은 메시지를 파싱
      setChatLog((prev) => [...prev, receivedMessage]);
      //   event.data.text().then((textMessage) => {
      //     setChatLog((prev) => [...prev, textMessage]); // 기존 채팅 로그에 새로운 메시지를 추가
      //   });
    };

    // WebSocket 연결이 끊어졌을 때 실행되는 코드
    ws.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };

    // WebSocket 객체를 상태에 저장하여 후에 사용할 수 있게 설정
    setSocket(ws);

    // 컴포넌트가 언마운트될 때 WebSocket 연결을 닫음
    return () => {
      ws.close();
    };
  }, []); // 빈 배열을 의존성으로 두어 컴포넌트가 처음 렌더링될 때 한 번만 실행

  // 메시지를 WebSocket 서버로 전송하는 함수
  const sendMessage = () => {
    // socket이 연결되어 있고, message가 비어 있지 않은 경우 메시지를 전송
    if (socket && message) {
      // 메시지에 닉네임과 메시지 내용을 함께 포함
      const messageData = {
        nickname,
        message,
      };
      socket.send(JSON.stringify(messageData)); // 메시지를 JSON 형식으로 서버에 전송 (닉네임 같이 보내는 경우)
      //   socket.send(message); // WebSocket을 통해 입력된 메시지를 서버로 보냄 (닉네임 같이 안 보내는 경우)
      setMessage(""); // 메시지를 보낸 후 입력 필드를 비웁니다.
    }
  };

  return (
    <div className="flex flex-col h-screen p-5">
      <h1 className="mb-5 text-center">WebSocket Chat</h1>

      <div className="flex flex-col-reverse flex-1 overflow-y-auto">
        <ul className="w-full">
          {/* 각 메시지를 클라이언트 닉네임에 따라 다른 색으로 표시 */}

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
          {/* {chatLog.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))} */}
        </ul>
      </div>
      <div className="flex gap-4 mt-5">
        <input
          type="text"
          value={message} // 입력된 메시지를 상태로 관리
          onChange={(e) => setMessage(e.target.value)} // 입력할 때마다 상태를 업데이트
          className="flex-1 p-2 text-gray-800 rounded"
          //   onKeyDown={(e) => {
          //     if (e.key === "Enter") {
          //       sendMessage();
          //     }
          //   }}
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
