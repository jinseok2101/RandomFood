import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { query, location, category } = req.query;
  const refinedQuery = `${location} ${query} ${
    category?.toString().split(">").pop() || "음식"
  }`;
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("API 키 설정 오류: .env.local의 변수명을 확인하세요.");
    return res
      .status(500)
      .json({ error: "Naver API keys are missing in environment variables" });
  }

  try {
    const response = await fetch(
      `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(
        query as string
      )}&display=1&sort=sim`,
      {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("네이버 API 응답 에러:", errorText);
      return res
        .status(response.status)
        .json({ error: "Naver API response error" });
    }

    const data = await response.json();

    // 검색 결과가 없을 경우 기본 이미지 반환
    if (!data.items || data.items.length === 0) {
      return res
        .status(200)
        .json({ imageUrl: "https://via.placeholder.com/300?text=No+Image" });
    }

    // 가장 연관도 높은 첫 번째 이미지 주소 반환
    res.status(200).json({ imageUrl: data.items[0].link });
  } catch (error) {
    console.error("서버 내부 에러:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
