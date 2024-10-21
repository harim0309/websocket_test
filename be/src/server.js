// ws는 WebSocket 프로토콜을 구현한 라이브러리로, 서버와 클라이언트 간의 실시간 통신을 관리하는 데 사용
// 이 라이브러리를 사용하여 WebSocket 서버를 생성
const WebSocket = require("ws");

// 서버 설정 (WebSocket 서버 인스턴스)
// Express나 HTTP 서버 없이 순수하게 WebSocket 서버만 실행
const wss = new WebSocket.Server({ port: 8080 });

// 방마다 클라이언트를 구분하기 위한 자료 구조 (각 방에 해당하는 클라이언트 목록)
const rooms = {};

// 클라이언트 연결 시
wss.on("connection", (ws, req) => {
  let currentRoomId;

  // 클라이언트로부터 메시지를 받았을 때 처리
  ws.on("message", (message) => {
    const parsedMessage = JSON.parse(message);
    const { roomId, nickname, message: chatMessage } = parsedMessage;

    // 클라이언트가 속한 방을 저장 (처음 연결 시 설정)
    if (!currentRoomId) {
      currentRoomId = roomId;

      // 방이 존재하지 않으면 새로 생성
      if (!rooms[roomId]) {
        rooms[roomId] = [];
      }
      rooms[roomId].push(ws); // 현재 클라이언트를 방 목록에 추가
    }

    console.log(
      `Received message in room ${roomId} from ${nickname}: ${chatMessage}`
    );

    // 같은 방에 있는 모든 클라이언트에게 메시지 전송
    rooms[roomId].forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ nickname, message: chatMessage }));
      }
    });
  });

  // 클라이언트 연결 종료 시 방 목록에서 제거
  ws.on("close", () => {
    if (currentRoomId && rooms[currentRoomId]) {
      rooms[currentRoomId] = rooms[currentRoomId].filter(
        (client) => client !== ws
      );
      console.log(`Client disconnected from room ${currentRoomId}`);

      // 방이 비어 있으면 삭제
      if (rooms[currentRoomId].length === 0) {
        delete rooms[currentRoomId];
        console.log(`Room ${currentRoomId} is now empty and deleted`);
      }
    }
  });
});

console.log("WebSocket server is running on ws://localhost:8080");
