// pages/api/login.js

import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req, res) {
  if (req.method === "POST") {
    const { username, password } = req.body;

    // 여기에 로그인 로직을 추가
    // 예시: username과 password를 확인
    if (username === "testUser" && password === "testPassword") {
      // 로그인 성공 시
      res.status(200).json({ message: "Login successful", userId: 1 });
    } else {
      // 로그인 실패 시
      res.status(401).json({ message: "Invalid credentials" });
    }
  } else {
    // 다른 메서드 (GET 등)에는 405 에러를 반환
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
