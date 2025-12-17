import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';

export default function Home() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showRetryBtn, setShowRetryBtn] = useState(false);
  
  const markersRef = useRef<{ marker: naver.maps.Marker; categoryLabel: string }[]>([]);
  const markerIds = useRef(new Set());
  const NCP_MAPS_CLIENT_ID = process.env.NEXT_PUBLIC_NCP_MAPS_CLIENT_ID;

  const categoryMap = [
    { label: '한식', color: '#ff4757', keywords: ['한식', '고기집'] },
    { label: '일식', color: '#2ed573', keywords: ['일식', '초밥'] },
    { label: '중식', color: '#ffa502', keywords: ['중식'] },
    { label: '카페', color: '#eccc68', keywords: ['카페'] },
    { label: '치킨/양식', color: '#ff6b81', keywords: ['치킨', '양식'] },
    { label: '기타', color: '#1e90ff', keywords: [] },
  ];

  const getCategoryLabel = (category: string) => {
    const found = categoryMap.find(c => c.keywords.some(k => category.includes(k)));
    return found ? found.label : '기타';
  };

  const getCategoryColor = (label: string) => {
    return categoryMap.find(c => c.label === label)?.color || '#1e90ff';
  };

  const filterMarkers = (label: string | null) => {
    setSelectedCategory(label);
    markersRef.current.forEach(({ marker, categoryLabel }) => {
      if (label === null || categoryLabel === label) marker.setMap(mapInstance.current);
      else marker.setMap(null);
    });
    infoWindowRef.current?.close();
  };

  const moveToMyLocation = () => {
    if (!mapInstance.current) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const myPos = new naver.maps.LatLng(position.coords.latitude, position.coords.longitude);
      mapInstance.current?.panTo(myPos);
    }, () => alert("위치 권한을 확인해주세요."));
  };

  const fetchCategory = async (map: naver.maps.Map, address: string, categoryKeyword: string) => {
    try {
      const res = await fetch(`/api/search?address=${encodeURIComponent(address)}&query=${encodeURIComponent(categoryKeyword)}`);
      const items = await res.json();
      if (!Array.isArray(items)) return;
      items.forEach((item: any) => {
        const id = item.title + item.address;
        if (markerIds.current.has(id)) return;
        markerIds.current.add(id);
        let mLat = Number(item.mapy) > 1000 ? Number(item.mapy) / 10000000 : Number(item.mapy);
        let mLng = Number(item.mapx) > 1000 ? Number(item.mapx) / 10000000 : Number(item.mapx);
        const label = getCategoryLabel(item.category || categoryKeyword);
        const color = getCategoryColor(label);
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(mLat, mLng),
          map: map,
          icon: { content: `<div style="width:14px; height:14px; background:${color}; border:2px solid white; border-radius:50%; box-shadow:0 0 5px rgba(0,0,0,0.3);"></div>`, anchor: new naver.maps.Point(7, 7) }
        });
        markersRef.current.push({ marker, categoryLabel: label });
        naver.maps.Event.addListener(marker, 'click', () => {
          infoWindowRef.current?.setContent(`<div style="padding:10px; font-size:12px;"><b>${item.title.replace(/<[^>]*>?/gm, '')}</b><br/>${item.category}</div>`);
          infoWindowRef.current?.open(map, marker);
        });
      });
    } catch (e) {}
  };

  const searchAllNearby = async (map: naver.maps.Map) => {
    const center = map.getCenter();
    setShowRetryBtn(false);
    naver.maps.Service.reverseGeocode({ coords: center }, async (status: any, response: any) => {
      if (status !== naver.maps.Service.Status.OK) return;
      const addr = response.v2.address.jibunAddress.split(' ').slice(0, 4).join(' ');
      await Promise.all(["한식", "일식", "중식", "카페", "고기집", "치킨"].map(k => fetchCategory(map, addr, k)));
      if (selectedCategory) filterMarkers(selectedCategory);
    });
  };

  useEffect(() => {
    if (!scriptLoaded || !window.naver || mapInstance.current) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const myPos = new naver.maps.LatLng(position.coords.latitude, position.coords.longitude);
      const map = new naver.maps.Map(mapRef.current!, { center: myPos, zoom: 16 });
      mapInstance.current = map;
      infoWindowRef.current = new naver.maps.InfoWindow({ backgroundColor: "#fff", borderColor: "#ddd", borderWidth: 1 });
      naver.maps.Event.once(map, 'init', () => searchAllNearby(map));
      naver.maps.Event.addListener(map, 'dragend', () => setShowRetryBtn(true));
      naver.maps.Event.addListener(map, 'click', () => infoWindowRef.current?.close());
    });
  }, [scriptLoaded]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
      <Head><title>맛집 지도</title></Head>
      
      {/* 🗺️ 지도는 배경으로 깔림 */}
      <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

      {/* 📍 왼쪽 상단 범례 */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 100, background: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid #eee', marginBottom: '5px' }}>카테고리</div>
        {categoryMap.map(cat => (
          <div key={cat.label} onClick={() => filterMarkers(cat.label)} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', cursor: 'pointer', padding: '3px 0' }}>
            <div style={{ width: '10px', height: '10px', background: cat.color, borderRadius: '50%' }}></div>
            <span style={{ color: selectedCategory === cat.label ? '#007bff' : '#333' }}>{cat.label}</span>
          </div>
        ))}
        <div onClick={() => filterMarkers(null)} style={{ fontSize: '10px', color: '#999', marginTop: '5px', cursor: 'pointer' }}>전체보기</div>
      </div>

      {/* 🔄 재검색 버튼 */}
      {showRetryBtn && (
        <button onClick={() => searchAllNearby(mapInstance.current!)} style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
          이 지역 재검색
        </button>
      )}

      {/* 🎯 내 위치 버튼 (디자인 업그레이드 버전) */}
<div 
  onClick={moveToMyLocation}
  style={{ 
    position: 'absolute', 
    bottom: '30px', 
    right: '20px', 
    zIndex: 1000, 
    
    // 외형 디자인
    width: '52px', 
    height: '52px', 
    backgroundColor: '#ffffff', 
    borderRadius: '12px', // 둥근 사각형 스타일
    border: '1px solid #e2e8f0', // 연한 회색 테두리
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)', // 부드러운 그림자
    
    // 정렬
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    cursor: 'pointer',
    transition: 'all 0.2s ease', // 클릭 시 애니메이션
  }}
  // 마우스 올렸을 때 효과 추가 (선택사항)
  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
>
  {/* GPS 아이콘 모양 (SVG 사용으로 더 깔끔하게) */}
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="#007bff" // 파란색 포인트 컬러
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
</div>

      {NCP_MAPS_CLIENT_ID && (
        <Script src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NCP_MAPS_CLIENT_ID}&submodules=geocoder`} onLoad={() => setScriptLoaded(true)} />
      )}
    </div>
  );
}