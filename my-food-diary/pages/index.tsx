import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script'; 
import { useGeolocation } from '../hooks/useGeolocation';
import { initializeNaverMap } from '../lib/naverMapLoader';
import { Place } from '../types'; 

export default function Home() {
    const { loading, coords, error } = useGeolocation();
    const mapContainerRef = useRef<HTMLDivElement>(null); 
    
    const [mapLoaded, setMapLoaded] = useState(false);
    const [places, setPlaces] = useState<Place[]>([]);
    const [searchStatus, setSearchStatus] = useState<'IDLE' | 'SEARCHING' | 'DONE'>('IDLE');

    // 💡 변경: 네이버 지도 키 변수명 사용 (NCP의 ncpKeyId에 해당)
    const NAVER_MAP_CLIENT_ID = process.env.NEXT_PUBLIC_NCP_MAPS_CLIENT_ID; 

    // 1. 지도 초기화 및 장소 검색 로직
    useEffect(() => {
        if (mapLoaded && !loading && mapContainerRef.current && searchStatus === 'IDLE') {
            
            const fetchRestaurants = async () => {
                setSearchStatus('SEARCHING');
                
                try {
                    // 💡 변경 1: 주소 변환 API 호출 (지역명 획득)
                    const addressResponse = await fetch(`/api/address?lat=${coords.lat}&lng=${coords.lng}`);
                    const addressData = await addressResponse.json();

                    if (!addressResponse.ok || !addressData.address) {
                        throw new Error("주소 변환 실패: " + addressData.message);
                    }
                    const regionName = addressData.address; // 예: "강남구 역삼동"
                    console.log(`✅ 주소 변환 성공: ${regionName}`);
                    
                    // 💡 변경 2: 장소 검색 API 호출 시 region 파라미터 추가
                    const response = await fetch(`/api/places?lat=${coords.lat}&lng=${coords.lng}&region=${regionName}`); 
                    
                    if (!response.ok) {
                        throw new Error(`API 응답 실패: ${response.status}`);
                    }
                    const data: Place[] = await response.json();

                    setPlaces(data);
                    setSearchStatus('DONE');
                    console.log(`✅ 실제 식당 ${data.length}개 검색 완료. (검색어에 ${regionName} 포함)`);
                    
                    initializeNaverMap(mapContainerRef.current!, coords, data); 

                } catch (error) {
                    setSearchStatus('DONE');
                    console.error("장소 검색 중 오류 발생:", error);
                    // 오류 시에도 지도 초기화 (데이터 없이)
                    initializeNaverMap(mapContainerRef.current!, coords, []); 
                }
            };

            fetchRestaurants();
        }
    }, [mapLoaded, loading, coords, searchStatus]);

    // API 키 체크 로직
    if (!NAVER_MAP_CLIENT_ID) {
        return (
            <div style={{ padding: '20px', color: 'red' }}>
                <h2>⚠️ API 키 설정 오류</h2>
                <p>환경 변수 NEXT_PUBLIC_NCP_MAPS_CLIENT_ID가 설정되지 않았습니다.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            
            <Script
                strategy="lazyOnload" 
                // 💡 변경 3: ncpClientId 대신 ncpKeyId 사용 (개편 반영)
                src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAP_CLIENT_ID}`}
                onLoad={() => {
                    console.log("✅ 네이버 지도 스크립트 로드 완료.");
                    setMapLoaded(true);
                }}
                onError={(e) => {
                    console.error("❌ 네이버 스크립트 로드 실패. Client ID 또는 도메인 설정 확인:", e);
                }}
            />
            
            {/* 🧭 로딩 메시지 */}
            {(loading || searchStatus === 'SEARCHING') && (
                <div style={{ marginBottom: '10px' }}>
                    {searchStatus === 'SEARCHING' ? '주변 식당 정보를 검색 중입니다...' : '현재 위치를 불러오는 중입니다...'}
                </div>
            )}
            
            <h1>지리 정보 기반 맛집 지도</h1>
            <p>
                현재 위치: 위도 **{coords.lat.toFixed(4)}**, 경도 **{coords.lng.toFixed(4)}**
                {!mapLoaded && <span> (지도 API 로딩 중...)</span>} 
            </p>
            
            {/* 🗺️ 지도를 표시할 영역 */}
            <div 
                ref={mapContainerRef} 
                style={{ width: '100%', height: '500px', border: '1px solid #ccc' }} 
                role="img"
                aria-label="네이버 지도 표시 영역"
            />
            
            {/* 📋 실제 맛집 목록 표시 영역 */}
            {searchStatus === 'DONE' && places.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h2>주변 맛집 검색 결과 ({places.length}개)</h2>
                    <ul>
                        {places.map(p => (
                            <li key={p.id}>
                                <a href={p.url} target="_blank" rel="noopener noreferrer">
                                    {p.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {searchStatus === 'DONE' && places.length === 0 && (
                <div style={{ marginTop: '20px', color: 'gray' }}>주변에 검색된 식당이 없습니다. (다른 곳으로 이동해 보세요.)</div>
            )}

        </div>
    );
}