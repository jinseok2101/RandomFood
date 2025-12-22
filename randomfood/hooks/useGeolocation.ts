// src/hooks/useGeolocation.ts

import { useState, useEffect } from 'react';
import { Coords } from '../types'; // src/types/index.ts에서 정의한 Coords 인터페이스

// 대한민국 서울 시청 좌표를 기본값으로 설정
const SEOUL_CITY_HALL: Coords = { lat: 37.566826, lng: 126.9786567 };

interface GeolocationState {
  loading: boolean;
  coords: Coords;
  error: GeolocationPositionError | null;
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    coords: SEOUL_CITY_HALL, // 초기값은 서울 시청으로 설정
    error: null,
  });

  useEffect(() => {
    // 브라우저 Geolocation API 사용 가능 여부 확인
    if (!navigator.geolocation) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: { code: 2, message: 'Geolocation is not supported by your browser.', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError,
        coords: SEOUL_CITY_HALL // 지원하지 않으면 기본값 사용
      }));
      return;
    }

    const onSuccess: PositionCallback = (position) => {
      setState({
        loading: false,
        coords: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        error: null,
      });
    };

    const onError: PositionErrorCallback = (error) => {
      setState(prev => ({
        ...prev,
        loading: false,
        error,
        coords: SEOUL_CITY_HALL // 에러 발생 시 기본값 사용
      }));
    };

    // 위치 정보 요청 (정확도를 높이기 위해 enableHighAccuracy 사용)
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    });

  }, []);

  return state;
}