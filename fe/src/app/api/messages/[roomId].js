// import mysql from "mysql2/promise";

// export default async function handler(req, res) {
//   const { roomId } = req.query;

//   const connection = await mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "0309",
//     database: "websocket_test",
//   });

//   const [rows] = await connection.execute(
//     "SELECT * FROM messages WHERE room_id = ?",
//     [roomId]
//   );
//   res.status(200).json(rows);
// }
