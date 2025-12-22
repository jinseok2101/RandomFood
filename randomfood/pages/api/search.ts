// pages/api/search.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { query } = req.query;

  // 1. 환경변수 체크 (브라우저 콘솔이 아닌 '터미널'에 뜹니다)
  const client_id = process.env.NAVER_SEARCH_CLIENT_ID;
  const client_secret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    console.error(
      "❌ API 키가 설정되지 않았습니다. .env.local 파일을 확인하세요."
    );
    return res.status(500).json({ error: "Server API Key Missing" });
  }

  try {
    const response = await fetch(
      `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(
        query as string
      )}&display=50&sort=comment`,
      {
        headers: {
          "X-Naver-Client-Id": client_id,
          "X-Naver-Client-Secret": client_secret,
        },
      }
    );

    const data = await response.json();

    // 2. 네이버에서 준 에러 메시지 확인
    if (!response.ok) {
      console.error("❌ 네이버 API 에러:", data);
      return res.status(response.status).json(data);
    }

    // 3. 결과 전송
    res.status(200).json(data.items || []);
  } catch (error) {
    console.error("❌ 서버 요청 실패:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
