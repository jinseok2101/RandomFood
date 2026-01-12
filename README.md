# 🎲 오늘 뭐 먹지? (Random Food World Cup)

"오늘 점심 뭐 먹지?" 고민을 해결해주는 네이버 지도 기반 음식점 랜덤 추천 및 월드컵 서비스입니다. 내 주변의 실제 식당 데이터를 바탕으로 랜덤 뽑기와 16강 월드컵을 즐겨보세요!

## 🚀 바로가기
**[🔗 서비스 접속하기 (Vercel 배포 주소)](사용자님의_버셜_주소를_여기에_넣으세요)**
> 예: https://random-food-worldcup.vercel.app

---

## ✨ 주요 기능

- **📍 내 주변 식당 자동 검색**: 현재 위치(Geolocation)를 기반으로 주변의 실제 음식점을 가져옵니다.
- **🎯 카테고리 필터링**: 한식, 양식, 일식, 카페 등 원하는 종류만 골라서 볼 수 있습니다.
- **📏 거리 설정**: 500m, 1km, 3km 반경 내의 식당을 자유롭게 설정합니다.
- **🎲 랜덤 뽑기**: 결정 장애를 위해 지도 위의 식당 중 하나를 무작위로 추천합니다.
- **🏆 메뉴 월드컵**: 주변 맛집들을 모아 16강/8강 월드컵을 진행하여 최종 메뉴를 선정합니다.

## 🛠 사용 기술

- **Framework**: Next.js (React)
- **Language**: TypeScript
- **Styling**: Inline CSS (React CSSProperties)
- **Map API**: NAVER Maps JavaScript API v3
- **Search API**: NAVER Search API (Local/Image)
- **Deployment**: Vercel

## 📖 사용 방법

1. **위치 권한 허용**: 브라우저에서 위치 정보 접근을 허용하면 자동으로 주변 식당을 불러옵니다.
2. **반경/카테고리 선택**: 상단 메뉴에서 검색 거리와 음식 종류를 필터링합니다.
3. **메뉴 결정하기**:
   - 하단의 **[랜덤 뽑기]** 버튼을 누르면 지도 위의 한 곳으로 화면이 이동하며 팝업이 뜹니다.
   - **[월드컵 시작]** 버튼을 누르면 현재 지도에 표시된 식당들로 대결이 시작됩니다.
4. **상세 정보**: 결정된 식당의 [길찾기] 버튼을 누르면 네이버 지도로 연결됩니다.

## ⚙️ 환경 변수 설정 (.env)

이 프로젝트를 로컬에서 실행하거나 배포할 때는 다음 API 키가 필요합니다.

```env
# Naver Cloud Platform (Maps)
NEXT_PUBLIC_NCP_MAPS_CLIENT_ID=your_id

# Naver Developers (Search)
NAVER_SEARCH_CLIENT_ID=your_id
NAVER_SEARCH_CLIENT_SECRET=your_secret
