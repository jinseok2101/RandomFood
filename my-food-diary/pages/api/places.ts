// pages/api/places.ts (지역 기반 키워드 검색 로직 적용)

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { Place } from '../../types'; 

// 네이버 Developers의 검색 API 키
const NAVER_CLIENT_ID = process.env.NAVER_DEVELOPERS_CLIENT_ID; 
const NAVER_CLIENT_SECRET = process.env.NAVER_DEVELOPERS_CLIENT_SECRET; 

// 네이버 검색 API 호출
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Place[] | { message: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  // 💡 변경 1: region 파라미터 추가
  const { lat, lng, region } = req.query; 

  if (!lat || !lng || Array.isArray(lat) || Array.isArray(lng)) {
    return res.status(400).json({ message: '위도(lat)와 경도(lng)가 필요합니다.' });
  }

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      return res.status(500).json({ message: '네이버 API 환경 변수가 설정되지 않았습니다.' });
  }

  try {
    // 💡 변경 2: 키워드에 지역명(region) 포함
    const baseQuery = '음식점'; 
    const query = `${region || ''} ${baseQuery}`.trim(); 
    
    const display = 20; 
    
    const naverApiUrl = `https://openapi.naver.com/v1/search/local.json`;

    // 3. 네이버 API 요청 (Axios 사용)
    const response = await axios.get(naverApiUrl, {
      params: {
        query: query, // 💡 변경 3: 지역명이 포함된 query 사용
        display: display,
        start: 1,
      },
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
    });

    // 4. 네이버 검색 결과를 Place 타입으로 변환
    const items = response.data.items;
    const transformedPlaces: Place[] = items.map((item: any) => ({
      id: item.mapx + item.mapy, 
      name: item.title.replace(/<[^>]*>?/gm, ''), 
      category: item.category.split('>').pop()?.trim() || 'ETC', 
      coords: { 
          lat: parseFloat(item.mapy) / 10000000, 
          lng: parseFloat(item.mapx) / 10000000 
      }, 
      avgRating: 0, 
      reviewCount: 0, 
      imageUrl: '', 
      url: item.link, 
    }));

    res.status(200).json(transformedPlaces);

  } catch (error) {
    console.error("네이버 검색 API 호출 오류:", error);
    res.status(500).json({ message: '네이버 검색 API 호출 중 서버 오류 발생' });
  }
}