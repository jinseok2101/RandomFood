import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { query, address } = req.query;
    const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
    const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) return res.status(500).json({ error: 'API 키 누락' });

    // 정확한 타겟팅을 위해 주소와 키워드 결합
    const refinedQuery = `${address} ${query}`;
    
    const targetUrl = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(
      refinedQuery
    )}&display=50&start=1&sort=comment`; // 인기/정확도 순

    const response = await fetch(targetUrl, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    const data = await response.json();
    res.status(200).json(data.items || []);
  } catch (error) {
    res.status(500).json([]);
  }
}