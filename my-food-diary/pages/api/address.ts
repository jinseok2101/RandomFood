import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// NCP 지도 API Client ID (ncpKeyId)
const NCP_CLIENT_ID = process.env.NEXT_PUBLIC_NCP_MAPS_CLIENT_ID; 

// 💡 Secret Key 불러오기
const NCP_CLIENT_SECRET = process.env.NCP_MAPS_CLIENT_SECRET;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ address: string } | { message: string }>
) {
  const { lat, lng } = req.query; 

  if (!lat || !lng || !NCP_CLIENT_ID || !NCP_CLIENT_SECRET) {
    return res.status(400).json({ message: '필수 파라미터 또는 환경 변수가 누락되었습니다.' });
  }

  try {
    const naverApiUrl = `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${lng},${lat}&output=json&orders=addr`;

    const response = await axios.get(naverApiUrl, {
      headers: {
    // Client ID
    'X-NCP-APIGW-API-KEY-ID': NCP_CLIENT_ID,        
    // 💡 Client Secret
    'X-NCP-APIGW-API-KEY': NCP_CLIENT_SECRET,       
  },
    });

    const results = response.data.results;

    if (results && results.length > 0) {
      // 행정동 주소 추출 (예: 서울특별시 강남구 역삼동)
      const region = results[0].region;
      const address = `${region.area2.name} ${region.area3.name}`; // 예: 강남구 역삼동
      
      return res.status(200).json({ address: address });
    }

    return res.status(404).json({ message: '주소를 찾을 수 없습니다.' });

  } catch (error) {
    console.error("Reverse Geocoding API 호출 오류:", error);
    return res.status(500).json({ message: '주소 변환 서버 오류' });
  }
}