const WebSocket = require("ws");
const url = require("url");

// 각 방에 대한 클라이언트 연결을 관리할 객체
const rooms = {};

// WebSocket 서버 생성
const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws, req) => {
  // URL에서 roomId를 추출
  const pathname = url.parse(req.url, true).pathname;
  const roomId = pathname.split("/")[2]; // /chat/:roomId 에서 roomId 추출

  if (!roomId) {
    console.error("Room ID is missing");
    ws.close(); // roomId가 없으면 연결 종료
    return;
  }

  // 클라이언트 객체에 roomId를 저장 (ws 객체에 속성 추가)
  ws.roomId = roomId;

  // 해당 roomId에 연결된 클라이언트 배열이 없으면 초기화
  if (!rooms[roomId]) {
    rooms[roomId] = [];
  }
  rooms[roomId].push(ws); // 해당 방에 클라이언트 추가

  console.log(`New client connected to room: ${roomId}`);

  ws.on("message", (message) => {
    const parsedMessage = JSON.parse(message); // 메시지 파싱
    console.log(
      `Received from ${parsedMessage.nickname} in room ${roomId}: ${parsedMessage.message}`
    );

    // 해당 roomId에 연결된 클라이언트들에게만 메시지 전송
    rooms[roomId].forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(parsedMessage)); // 메시지 전송
      }
    });
  });

  ws.on("close", () => {
    const clientRoomId = ws.roomId;
    console.log(`Client disconnected from room: ${clientRoomId}`);

    // 해당 roomId에서 클라이언트를 제거
    rooms[clientRoomId] = rooms[clientRoomId].filter((client) => client !== ws);

    // 방이 비었으면 방 자체를 삭제
    if (rooms[clientRoomId].length === 0) {
      delete rooms[clientRoomId];
    }
  });
});

console.log("WebSocket server is running on ws://localhost:8080");
