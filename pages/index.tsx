import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Script from "next/script";
import { CATEGORIES } from "../constants/MapConstants";
import {
  checkCategory,
  getCategoryColor,
  getCleanTitle,
} from "../utils/MapUtils";
import { WorldCupOverlay } from "../components/WorldCupOverlay";
import { useWorldCup } from "../hooks/useWorldCup";

const CATEGORY_IMAGES: { [key: string]: string } = {
  한식: "/images/korean.jpg",
  일식: "/images/japanese.jpg",
  중식: "/images/chinese.jpg",
  양식: "/images/western.jpg",
  카페: "/images/cafe.jpg",
  치킨: "/images/chicken.jpg",
  분식: "/images/tteokbokki.jpg",
  고기: "/images/meat.jpg",
  피자: "/images/pizza.jpg",
  패스트푸드: "/images/fastfood.jpg",
  default: "/images/default.jpg",
};

export default function Home() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const myMarkerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const markerIds = useRef(new Set());

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [pickedStore, setPickedStore] = useState<any>(null);
  const [radius, setRadius] = useState(1000);
  const [selectedCategory, setSelectedCategory] = useState("전체");

  const {
    worldCupMode,
    setWorldCupMode,
    currentMatch,
    startWorldCup,
    selectWinner,
    roundInfo,
  } = useWorldCup();

  const NCP_MAPS_CLIENT_ID = process.env.NEXT_PUBLIC_NCP_MAPS_CLIENT_ID;

  const getFallbackImage = (category: string) => {
    if (category.includes("한식")) return CATEGORY_IMAGES["한식"];
    if (category.includes("일식") || category.includes("돈가스"))
      return CATEGORY_IMAGES["일식"];
    if (category.includes("중식")) return CATEGORY_IMAGES["중식"];
    if (
      category.includes("양식") ||
      category.includes("이탈리아") ||
      category.includes("스테이크")
    )
      return CATEGORY_IMAGES["양식"];
    if (
      category.includes("카페") ||
      category.includes("커피") ||
      category.includes("베이커리")
    )
      return CATEGORY_IMAGES["카페"];
    if (category.includes("치킨")) return CATEGORY_IMAGES["치킨"];
    if (category.includes("분식")) return CATEGORY_IMAGES["분식"];
    if (category.includes("피자")) return CATEGORY_IMAGES["피자"];
    if (
      category.includes("육류") ||
      category.includes("고기") ||
      category.includes("곱창")
    )
      return CATEGORY_IMAGES["고기"];
    if (category.includes("햄버거") || category.includes("패스트푸드"))
      return CATEGORY_IMAGES["패스트푸드"];

    return CATEGORY_IMAGES["default"];
  };

  const fetchRestaurants = async (map: any) => {
    const center = map.getCenter();
    window.naver.maps.Service.reverseGeocode(
      { coords: center },
      async (status: any, response: any) => {
        if (status !== window.naver.maps.Service.Status.OK) return;

        const address = response.v2.address.jibunAddress
          .split(" ")
          .slice(0, 4)
          .join(" ");
        const keywords = [
          "음식점",
          "식당",
          "카페",
          "치킨",
          "분식",
          "고기",
          "피자",
          "돈가스",
        ];

        for (const k of keywords) {
          try {
            const res = await fetch(
              `/api/search?query=${encodeURIComponent(
                address + " " + k,
              )}&display=50`,
            );
            const items = await res.json();
            if (!Array.isArray(items)) continue;

            items.forEach((item: any) => {
              const id = item.title + item.address;
              if (markerIds.current.has(id)) return;
              markerIds.current.add(id);

              const mLat =
                Number(item.mapy) > 1000
                  ? Number(item.mapy) / 10000000
                  : Number(item.mapy);
              const mLng =
                Number(item.mapx) > 1000
                  ? Number(item.mapx) / 10000000
                  : Number(item.mapx);
              const cleanTitle = getCleanTitle(item.title);
              const imageUrl = getFallbackImage(item.category);

              const marker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(mLat, mLng),
                map: checkCategory(item.category, selectedCategory)
                  ? map
                  : null,
                icon: {
                  content: `<div style="width:14px; height:14px; background:${getCategoryColor(
                    item.category,
                  )}; border:2px solid white; border-radius:50%; box-shadow:0 2px 4px rgba(0,0,0,0.3); cursor:pointer;"></div>`,
                  anchor: new window.naver.maps.Point(7, 7),
                },
              });

              window.naver.maps.Event.addListener(marker, "click", () => {
                setPickedStore({
                  title: cleanTitle,
                  category: item.category,
                  imageUrl: imageUrl,
                  url: `https://map.naver.com/v5/search/${encodeURIComponent(
                    cleanTitle,
                  )}`,
                });
              });

              marker.set("title", cleanTitle);
              marker.set("category", item.category);
              marker.set("imageUrl", imageUrl);
              markersRef.current.push(marker);
            });
          } catch (e) {
            console.error(e);
          }
        }
      },
    );
  };

  // ⭐ 내 위치로 지도 이동시키는 함수 (커스텀 버튼용)
  const handleMoveToMyLocation = () => {
    if (!mapInstance.current) return;

    navigator.geolocation.getCurrentPosition(
      (p) => {
        const myPos = new window.naver.maps.LatLng(
          p.coords.latitude,
          p.coords.longitude,
        );
        mapInstance.current.panTo(myPos); // 부드럽게 이동

        // 내 위치 파란색 마커 위치 업데이트
        if (myMarkerRef.current) {
          myMarkerRef.current.setPosition(myPos);
        }
      },
      (err) => {
        alert("위치 정보를 가져올 수 없습니다. 권한을 확인해주세요.");
      },
    );
  };

  const rollMenu = () => {
    const center = mapInstance.current?.getCenter();
    const available = markersRef.current.filter(
      (m) =>
        m.getMap() !== null &&
        mapInstance.current
          .getProjection()
          .getDistance(center, m.getPosition()) <= radius,
    );

    if (available.length === 0) return alert("주변에 음식점이 없습니다.");

    setIsRolling(true);
    setPickedStore(null);
    let count = 0;
    const interval = setInterval(() => {
      const target = available[Math.floor(Math.random() * available.length)];
      mapInstance.current?.panTo(target.getPosition());
      if (++count > 20) {
        clearInterval(interval);
        setIsRolling(false);
        setPickedStore({
          title: target.get("title"),
          category: target.get("category"),
          imageUrl: target.get("imageUrl"),
          url: `https://map.naver.com/v5/search/${encodeURIComponent(
            target.get("title"),
          )}`,
        });
      }
    }, 120);
  };

  useEffect(() => {
    if (!scriptLoaded || !window.naver || mapInstance.current) return;

    const map = new window.naver.maps.Map(mapRef.current!, {
      center: new window.naver.maps.LatLng(37.5546, 126.9706),
      zoom: 17,
    });
    mapInstance.current = map;

    navigator.geolocation.getCurrentPosition(
      (p) => {
        const myPos = new window.naver.maps.LatLng(
          p.coords.latitude,
          p.coords.longitude,
        );
        map.setCenter(myPos);
        myMarkerRef.current = new window.naver.maps.Marker({
          position: myPos,
          map,
          zIndex: 100,
          icon: {
            content: `<div style="width:20px; height:20px; background:#007bff; border:3px solid white; border-radius:50%;"></div>`,
            anchor: new window.naver.maps.Point(10, 10),
          },
        });
        fetchRestaurants(map);
      },
      () => fetchRestaurants(map),
    );

    window.naver.maps.Event.addListener(map, "idle", () =>
      fetchRestaurants(map),
    );
  }, [scriptLoaded]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        fontFamily: "sans-serif",
        backgroundColor: "#f0f2f5",
      }}
    >
      <Head>
        <title>오메추</title>
      </Head>

      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          visibility: worldCupMode ? "hidden" : "visible",
        }}
      />

      {worldCupMode && currentMatch && (
        <WorldCupOverlay
          currentMatch={currentMatch}
          roundInfo={roundInfo}
          onSelect={(winner: any) => {
            const final = selectWinner(winner);
            if (final) {
              setPickedStore(final);
              setWorldCupMode(false);
            }
          }}
          onClose={() => setWorldCupMode(false)}
        />
      )}

      {!worldCupMode && (
        <>
          {/* 상단 필터 영역 */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {/* 반경 선택 버튼 */}
            <div
              style={{
                display: "flex",
                gap: "5px",
                background: "white",
                padding: "5px",
                borderRadius: "15px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              }}
            >
              {[500, 1000, 3000].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRadius(r);
                    markerIds.current.clear();
                    markersRef.current.forEach((m) => m.setMap(null));
                    markersRef.current = [];
                    fetchRestaurants(mapInstance.current);
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "none",
                    background: radius === r ? "#ff4757" : "none",
                    color: radius === r ? "white" : "#555",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                </button>
              ))}
            </div>
            {/* 카테고리 선택 버튼 */}
            <div
              style={{
                display: "flex",
                gap: "5px",
                background: "white",
                padding: "5px",
                borderRadius: "15px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                flexWrap: "wrap",
                maxWidth: "280px",
              }}
            >
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    markersRef.current.forEach((m) =>
                      m.setMap(
                        checkCategory(m.get("category"), cat)
                          ? mapInstance.current
                          : null,
                      ),
                    );
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "none",
                    background: selectedCategory === cat ? "#333" : "#f1f1f1",
                    color: selectedCategory === cat ? "white" : "#555",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleMoveToMyLocation}
            title="내 위치로 이동"
            style={{
              position: "absolute",
              bottom: "150px", // 하단 뽑기 버튼 위쪽으로 적절히 배치
              left: "20px",
              width: "45px",
              height: "45px",
              borderRadius: "8px", // 약간 각진 둥근 사각형 (지도 앱 스타일)
              backgroundColor: "white",
              border: "1px solid rgba(0,0,0,0.1)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              cursor: "pointer",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f8f9fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "white")
            }
          >
            {/* GPS 아이콘 모양의 SVG (이모지보다 훨씬 깔끔합니다) */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 8V12M12 12V16M12 12H16M12 12H8M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"
                stroke="#333"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="2" fill="#333" />
            </svg>
          </button>

          {/* 하단 월드컵/뽑기 버튼 영역 */}
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              width: "85%",
              maxWidth: "400px",
            }}
          >
            <button
              onClick={() =>
                startWorldCup(
                  markersRef.current
                    .filter((m) => m.getMap() !== null)
                    .map((m) => ({
                      title: m.get("title"),
                      category: m.get("category"),
                      imageUrl: m.get("imageUrl"),
                      url: `https://map.naver.com/v5/search/${encodeURIComponent(
                        m.get("title"),
                      )}`,
                    })),
                )
              }
              style={{
                height: "55px",
                borderRadius: "15px",
                border: "none",
                background: "#333",
                color: "white",
                fontSize: "18px",
                fontWeight: "bold",
                boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                cursor: "pointer",
              }}
            >
              🏆 메뉴 월드컵 시작
            </button>
            <button
              onClick={rollMenu}
              disabled={isRolling}
              style={{
                height: "65px",
                borderRadius: "20px",
                border: "none",
                background: isRolling ? "#ccc" : "#ff4757",
                color: "white",
                fontSize: "20px",
                fontWeight: "bold",
                boxShadow: "0 8px 25px rgba(255, 71, 87, 0.4)",
                cursor: "pointer",
              }}
            >
              {isRolling ? "고르는 중..." : `🎲 ${selectedCategory} 랜덤 뽑기`}
            </button>
          </div>
        </>
      )}

      {/* 결과 창 팝업 */}
      {pickedStore && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "85%",
            maxWidth: "340px",
            background: "white",
            padding: "25px",
            borderRadius: "25px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            zIndex: 3000,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "180px",
              backgroundImage: `url(${pickedStore.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: "15px",
              marginBottom: "15px",
            }}
          />
          <h2
            style={{
              fontSize: "24px",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            {pickedStore.title}
          </h2>
          <p style={{ fontSize: "13px", color: "#888", marginBottom: "25px" }}>
            {pickedStore.category.replace(/>/g, " > ")}
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setPickedStore(null)}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: "15px",
                border: "1px solid #eee",
                background: "#f8f9fa",
                cursor: "pointer",
              }}
            >
              닫기
            </button>
            <a
              href={pickedStore.url}
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 2,
                background: "#03C75A",
                color: "white",
                textDecoration: "none",
                padding: "14px",
                borderRadius: "15px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              길찾기
            </a>
          </div>
        </div>
      )}

      {NCP_MAPS_CLIENT_ID && (
        <Script
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NCP_MAPS_CLIENT_ID}&submodules=geocoder`}
          onLoad={() => setScriptLoaded(true)}
        />
      )}
    </div>
  );
}
