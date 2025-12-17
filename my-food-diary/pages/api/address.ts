import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// 1. 환경 변수 로드
const NCP_CLIENT_ID = process.env.NEXT_PUBLIC_NCP_MAPS_CLIENT_ID; 
const NCP_CLIENT_SECRET = process.env.NCP_MAPS_CLIENT_SECRET; 

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ address: string } | { message: string }>
) {
  // req.query의 타입 안전성 확보
  const latStr = req.query.lat as string;
  const lngStr = req.query.lng as string;
  
  // 2. 필수 파라미터 및 환경 변수 검증
  if (!latStr || !lngStr || !NCP_CLIENT_ID || !NCP_CLIENT_SECRET) {
    // 키 값에 공백이 포함된 경우, 이 검증은 통과하지만 나중에 401 오류가 발생할 수 있습니다.
    return res.status(400).json({ message: '필수 파라미터 또는 환경 변수가 누락되었습니다.' });
  }

  const lat = Number(latStr);
  const lng = Number(lngStr);
  
  try {
    // 3. Reverse Geocoding API URL 정의
    // 💡 공식 문서 필수 파라미터 포함: request=coordsToaddr, sourcecrs=epsg:4326
    const queryParams = `request=coordsToaddr&coords=${lng},${lat}&sourcecrs=epsg:4326&orders=addr&output=json`;
    const naverApiUrl = `https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc?${queryParams}`;

    // 4. Axios 요청 및 Client ID/Secret을 헤더에 직접 전송
    const response = await axios.get(naverApiUrl, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': NCP_CLIENT_ID,        
        'X-NCP-APIGW-API-KEY': NCP_CLIENT_SECRET,       
      },
    });

    // 5. 주소 데이터 파싱
    const results = response.data.results;

    if (results && results.length > 0) {
      const region = results[0].region;
      const address = `${region.area1.name} ${region.area2.name} ${region.area3.name}`; 
      
      return res.status(200).json({ address: address });
    }

    return res.status(404).json({ message: '주소를 찾을 수 없습니다.' });

  } catch (error: any) {
    // 6. 상세 오류 처리 로직
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.error?.message || '내부 서버 오류';
    
    const clientMessage = (status === 401 || status === 403) 
                            ? `인증 실패: 키 설정 또는 권한 문제` 
                            : errorMessage;
    
    console.error(`Reverse Geocoding API 호출 오류: ${status} ${clientMessage}`, error.message);
    
    return res.status(status).json({ message: `주소 변환 실패: ${clientMessage}` });
  }
}