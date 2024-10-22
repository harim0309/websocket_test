const mysql = require("mysql2");
const WebSocket = require("ws");
const url = require("url");
const express = require("express");
const cors = require("cors");

// MySQL 데이터베이스 연결 설정
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // 사용자 이름
  password: "0309", // 비밀번호
  database: "websocket_test", // 사용할 데이터베이스 이름
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL database");
});

// Express 서버 설정
const app = express();
app.use(
  cors({
    origin: "http://localhost:3000", // 클라이언트의 주소
    methods: ["GET", "POST"], // 허용할 HTTP 메서드
    credentials: true, // 쿠키와 인증 헤더를 허용
  })
);

app.use(express.json()); // JSON 형식의 요청 본문을 처리하기 위한 미들웨어

// 사용자 로그인 API
app.post("/api/login", (req, res) => {
  const { username } = req.body; // 클라이언트에서 사용자 이름을 받음

  // 사용자 ID 생성 및 데이터베이스에 저장
  const userId = Math.floor(Math.random() * 10000); // 랜덤 사용자 ID 생성
  db.query(
    "INSERT INTO users (id, username) VALUES (?, ?)",
    [userId, username],
    (err) => {
      if (err) return res.status(500).send("Database error");
      res.json({ userId }); // 클라이언트에게 사용자 ID 반환
    }
  );
});

// 채팅 목록 API
app.get("/api/rooms/:userId", (req, res) => {
  const userId = req.params.userId;

  db.query(
    `
    SELECT cr.* 
    FROM chat_rooms cr
    JOIN room_members rm ON cr.id = rm.room_id
    WHERE rm.user_id = ?
    `,
    [userId],
    (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).send("Database error");
      }
      res.json(results); // 채팅방 목록 반환
    }
  );
});

// 채팅방 추가 API
app.post("/api/rooms", (req, res) => {
  const { userId, targetUserIds } = req.body; // targetUserIds는 배열로 받음

  // 입력된 userId와 targetUserIds에 해당하는 사용자들의 이름을 조회
  const allUserIds = [userId, ...targetUserIds]; // 방 생성자와 대상 사용자들 모두 포함
  db.query(
    "SELECT username FROM users WHERE id IN (?)",
    [allUserIds],
    (err, results) => {
      if (err) {
        console.error("Error fetching usernames:", err);
        return res.status(500).send("Database error");
      }

      // 사용자 이름들을 배열로 가져옴
      const usernames = results.map((row) => row.username);

      // 사용자 이름들을 쉼표로 구분해서 roomName 생성
      const roomName = usernames.join(", ");

      // 채팅방 생성
      db.query(
        "INSERT INTO chat_rooms (room_name, creator_id) VALUES (?, ?)",
        [roomName, userId], // 사용자 이름을 조합한 방 이름과 생성자 ID
        (err, results) => {
          if (err) {
            console.error("Error creating chat room:", err);
            return res.status(500).send("Database error");
          }

          const roomId = results.insertId; // 새로 생성된 방 ID

          // 생성된 방에 방 생성자 추가
          db.query(
            "INSERT INTO room_members (room_id, user_id) VALUES (?, ?)",
            [roomId, userId],
            (err) => {
              if (err) {
                console.error("Error adding creator to room:", err);
                return res.status(500).send("Database error");
              }

              // targetUserIds 배열을 사용하여 다수의 상대방 추가
              const values = targetUserIds.map((targetUserId) => [
                roomId,
                targetUserId,
              ]);

              db.query(
                "INSERT INTO room_members (room_id, user_id) VALUES ?",
                [values], // 여러 명을 한 번에 추가
                (err) => {
                  if (err) {
                    console.error("Error adding target users to room:", err);
                    return res.status(500).send("Database error");
                  }
                  res.json({ roomId, roomName }); // 생성된 방 ID와 이름 반환
                }
              );
            }
          );
        }
      );
    }
  );
});

// WebSocket 서버 설정
const wss = new WebSocket.Server({ port: 8080 });
const rooms = {};

wss.on("connection", (ws, req) => {
  const pathname = url.parse(req.url, true).pathname;
  const roomId = pathname.split("/")[2]; // /chat/:roomId 에서 roomId 추출

  if (!roomId) {
    console.error("Room ID is missing");
    ws.close(); // roomId가 없으면 연결 종료
    return;
  }

  // 해당 roomId에 연결된 클라이언트 배열이 없으면 초기화
  if (!rooms[roomId]) {
    rooms[roomId] = [];
  }
  rooms[roomId].push(ws); // 해당 방에 클라이언트 추가

  console.log(`New client connected to room: ${roomId}`);

  ws.on("message", (message) => {
    const parsedMessage = JSON.parse(message); // 메시지 파싱
    const { nickname, message: chatMessage } = parsedMessage;

    // 메시지를 데이터베이스에 저장
    db.query(
      "INSERT INTO messages (room_id, nickname, message) VALUES (?, ?, ?)",
      [roomId, nickname, chatMessage],
      (err) => {
        if (err) console.error("Database error:", err);
      }
    );

    // 해당 roomId에 연결된 클라이언트들에게만 메시지 전송
    rooms[roomId].forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(parsedMessage)); // 메시지 전송
      }
    });
  });

  ws.on("close", () => {
    console.log(`Client disconnected from room: ${roomId}`);
    // 해당 roomId에서 클라이언트를 제거
    rooms[roomId] = rooms[roomId].filter((client) => client !== ws);
  });
});

console.log("WebSocket server is running on ws://localhost:8080");
app.listen(3001, () => {
  console.log("Express server is running on http://localhost:3001");
});
