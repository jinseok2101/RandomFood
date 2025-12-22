// src/lib/naverMapLoader.ts

import { Coords, Place } from '../types';

declare global {
  interface Window {
    naver: any; // 네이버 전역 객체
  }
}

// 카카오맵과 통일성을 위해 함수 이름 변경
export const initializeNaverMap = (container: HTMLDivElement, coords: Coords, places: Place[]) => {
  if (!window.naver || !container) {
    console.error("🚨 네이버 객체 또는 지도 컨테이너가 준비되지 않았습니다.");
    return;
  }

  try {
    // 1. 지도 중심 좌표 (네이버는 LatLng를 사용, lat, lng 순서)
    const center = new window.naver.maps.LatLng(coords.lat, coords.lng);

    // 2. 지도 생성 옵션 (줌 레벨은 15가 적당)
    const map = new window.naver.maps.Map(container, { 
        center: center,
        zoom: 15, 
        scaleControl: true
    });

    // -------------------------------------------------------------
    // ⭐ 현재 위치 마커 커스텀 이미지 (네이버 기본 URL 사용)
    const currentMarkerIcon = {
        content: '<div style="width:30px; height:30px; background-color:orange; border-radius:50%; border:2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5); text-align:center; line-height:30px; font-weight:bold; color:white;">나</div>',
        size: new window.naver.maps.Size(30, 30),
        anchor: new window.naver.maps.Point(15, 15) // 중심점을 중앙으로 설정
    };

    // 3. 현재 위치 마커 표시 (커스텀 HTML 아이콘 적용)
    new window.naver.maps.Marker({
        position: center, 
        map: map,
        icon: currentMarkerIcon, // 👈 커스텀 HTML 아이콘 적용
        title: '나의 현재 위치'
    });
    // -------------------------------------------------------------

    // 4. 맛집 목록 마커 및 이벤트 추가
    places.forEach(place => {
      const placePosition = new window.naver.maps.LatLng(place.coords.lat, place.coords.lng);
      
      const placeMarker = new window.naver.maps.Marker({
        position: placePosition,
        map: map, // 지도에 바로 표시
        title: place.name // 마커에 마우스를 올리면 이름이 표시되도록 설정
      });

      // 💡 마커 클릭 시 이벤트 등록 (새 탭에서 페이지 이동)
      window.naver.maps.Event.addListener(placeMarker, 'click', function() {
        if (place.url) {
             window.open(place.url, '_blank');
        } else {
             alert(`[${place.name}]의 URL 정보가 없어 페이지로 이동할 수 없습니다.`);
        }
      });
    }); 
    
    console.log("✅ 네이버 지도 및 이벤트 등록 성공!");

  } catch (error) {
    console.error("❌ 네이버 지도 생성 중 런타임 오류 발생:", error);
  }
};