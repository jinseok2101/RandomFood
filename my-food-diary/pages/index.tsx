import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Script from "next/script";

export default function Home() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const myMarkerRef = useRef<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [pickedStore, setPickedStore] = useState<any>(null);
  const [radius, setRadius] = useState(1000);
  const [selectedCategory, setSelectedCategory] = useState("전체");

  const markersRef = useRef<any[]>([]);
  const markerIds = useRef(new Set());
  const NCP_MAPS_CLIENT_ID = process.env.NEXT_PUBLIC_NCP_MAPS_CLIENT_ID;

  const categories = [
    "전체",
    "한식",
    "일식",
    "중식",
    "양식",
    "카페",
    "분식",
    "치킨",
    "패스트푸드",
  ];

  const categoryStyles: { [key: string]: string } = {
    한식: "#ff4757",
    일식: "#2e86de",
    중식: "#228f02",
    양식: "#f39c12",
    카페: "#6d4c41",
    분식: "#eb4d4b",
    치킨: "#e67e22",
    패스트푸드: "#ff6b6b",
    기타: "#7f8c8d",
  };

  // 💡 [중요] 카테고리 판별 로직을 하나로 통합
  const checkCategory = (itemCat: string, selectedCat: string) => {
    if (selectedCat === "전체") return true;

    if (selectedCat === "한식") {
      return ["한식", "김밥", "갈비", "삼겹살", "육류", "고기", "분식"].some(
        (k) => itemCat.includes(k)
      );
    }
    if (selectedCat === "일식") {
      return ["일식", "스시", "초밥", "돈가스", "돈까스"].some((k) =>
        itemCat.includes(k)
      );
    }
    if (selectedCat === "중식") {
      return ["중식", "짜장", "짬뽕", "마라탕"].some((k) =>
        itemCat.includes(k)
      );
    }
    if (selectedCat === "양식") {
      return ["양식", "파스타", "스테이크"].some((k) => itemCat.includes(k));
    }
    if (selectedCat === "카페") {
      return ["카페", "커피", "빵", "베이커리", "디저트"].some((k) =>
        itemCat.includes(k)
      );
    }
    if (selectedCat === "분식") {
      return ["분식", "떡볶이", "오뎅", "어묵", "튀김"].some((k) =>
        itemCat.includes(k)
      );
    }
    if (selectedCat === "패스트푸드") {
      return ["햄버거", "버거", "피자", "도넛", "패스트푸드"].some((k) =>
        itemCat.includes(k)
      );
    }
    return itemCat.includes(selectedCat);
  };

  // 💡 색상 결정 로직에도 통합 함수 적용
  const getCategoryColor = (category: string) => {
    for (const cat of categories) {
      if (cat !== "전체" && checkCategory(category, cat))
        return categoryStyles[cat];
    }
    return categoryStyles["기타"];
  };

  const filterMarkers = (category: string) => {
    markersRef.current.forEach((marker) => {
      const isVisible = checkCategory(marker.get("category"), category);
      marker.setMap(isVisible ? mapInstance.current : null);
    });
  };

  const fetchRestaurants = async (map: any) => {
    const center = map.getCenter();
    (window as any).naver.maps.Service.reverseGeocode(
      { coords: center },
      async (status: any, response: any) => {
        if (status !== (window as any).naver.maps.Service.Status.OK) return;
        const address = response.v2.address.jibunAddress
          .split(" ")
          .slice(0, 4)
          .join(" ");

        // 💡 "맛집" 키워드 제거 및 "음식점", "고기" 등 키워드 최적화
        const keywords = [
          "음식점",
          "식당",
          "카페",
          "치킨",
          "분식",
          "고기",
          "육류",
          "피자",
          "돈가스",
          "햄버거",
        ];

        for (const k of keywords) {
          try {
            const res = await fetch(
              `/api/search?query=${encodeURIComponent(
                address + " " + k
              )}&display=50`
            );
            const items = await res.json();
            if (!Array.isArray(items)) continue;

            items.forEach((item: any) => {
              const id = item.title + item.address;
              if (markerIds.current.has(id)) return;

              let mLat =
                Number(item.mapy) > 1000
                  ? Number(item.mapy) / 10000000
                  : Number(item.mapy);
              let mLng =
                Number(item.mapx) > 1000
                  ? Number(item.mapx) / 10000000
                  : Number(item.mapx);
              const pos = new (window as any).naver.maps.LatLng(mLat, mLng);

              markerIds.current.add(id);

              // 💡 마커 생성 시 현재 선택된 카테고리와 일치하는지 확인 (통합 로직 사용)
              const isMatch = checkCategory(item.category, selectedCategory);

              const marker = new (window as any).naver.maps.Marker({
                position: pos,
                map: isMatch ? map : null,
                icon: {
                  content: `<div style="width:14px; height:14px; background:${getCategoryColor(
                    item.category
                  )}; border:2px solid white; border-radius:50%; box-shadow:0 0 5px rgba(0,0,0,0.2);"></div>`,
                  anchor: new (window as any).naver.maps.Point(7, 7),
                },
              });
              marker.set("title", item.title.replace(/<[^>]*>?/gm, ""));
              marker.set("category", item.category);
              markersRef.current.push(marker);
            });
          } catch (e) {
            console.error(e);
          }
        }
      }
    );
  };

  // ... (rollMenu, moveToMyLocation, useEffect 로직은 동일)
  const rollMenu = () => {
    const center = mapInstance.current?.getCenter();
    const availableMarkers = markersRef.current.filter((m) => {
      if (!center) return false;
      const isVisible = m.getMap() !== null;
      return (
        isVisible &&
        mapInstance.current
          .getProjection()
          .getDistance(center, m.getPosition()) <= radius
      );
    });

    if (availableMarkers.length === 0)
      return alert(`${selectedCategory} 주변에 음식점이 없습니다.`);

    setIsRolling(true);
    setPickedStore(null);

    let count = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * availableMarkers.length);
      const tempTarget = availableMarkers[randomIndex];
      mapInstance.current?.panTo(tempTarget.getPosition());
      count++;
      if (count > 20) {
        clearInterval(interval);
        setIsRolling(false);
        const finalTarget = availableMarkers[randomIndex];
        setPickedStore({
          title: finalTarget.get("title"),
          category: finalTarget.get("category"),
          url: `https://map.naver.com/v5/search/${encodeURIComponent(
            finalTarget.get("title")
          )}`,
        });
      }
    }, 120);
  };

  const moveToMyLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const myPos = new (window as any).naver.maps.LatLng(
        pos.coords.latitude,
        pos.coords.longitude
      );
      mapInstance.current.setCenter(myPos);
      if (myMarkerRef.current) myMarkerRef.current.setPosition(myPos);
      fetchRestaurants(mapInstance.current);
    });
  };

  useEffect(() => {
    if (!scriptLoaded || !window.naver || mapInstance.current) return;
    const map = new (window as any).naver.maps.Map(mapRef.current!, {
      center: new (window as any).naver.maps.LatLng(37.554678, 126.970606),
      zoom: 17,
    });
    mapInstance.current = map;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const myPos = new (window as any).naver.maps.LatLng(
          position.coords.latitude,
          position.coords.longitude
        );
        map.setCenter(myPos);
        myMarkerRef.current = new (window as any).naver.maps.Marker({
          position: myPos,
          map: map,
          zIndex: 100,
          icon: {
            content: `<div style="width:20px; height:20px; background:#007bff; border:3px solid white; border-radius:50%;"></div>`,
            anchor: new (window as any).naver.maps.Point(10, 10),
          },
        });
        fetchRestaurants(map);
      },
      () => fetchRestaurants(map)
    );
    (window as any).naver.maps.Event.addListener(map, "idle", () =>
      fetchRestaurants(map)
    );
  }, [scriptLoaded]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "sans-serif",
      }}
    >
      <Head>
        <title>오늘 뭐 먹지?</title>
      </Head>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

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
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                filterMarkers(cat);
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

      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "75px",
          zIndex: 100,
          background: "white",
          padding: "10px 15px",
          borderRadius: "15px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          fontSize: "11px",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            marginBottom: "8px",
            borderBottom: "1px solid #eee",
            paddingBottom: "4px",
          }}
        >
          범례
        </div>
        {Object.entries(categoryStyles).map(([name, color]) => (
          <div
            key={name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "100%",
                aspectRatio: "1/1",
                background: color,
                borderRadius: "50%",
              }}
            ></div>
            <span style={{ color: "#444" }}>{name}</span>
          </div>
        ))}
      </div>

      <button
        onClick={moveToMyLocation}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 100,
          width: "45px",
          height: "45px",
          background: "white",
          border: "none",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          cursor: "pointer",
        }}
      >
        🎯
      </button>

      {pickedStore && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            maxWidth: "320px",
            background: "white",
            padding: "30px",
            borderRadius: "25px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            zIndex: 1000,
            textAlign: "center",
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "bold",
              background: getCategoryColor(pickedStore.category),
              color: "white",
              marginBottom: "10px",
            }}
          >
            {pickedStore.category.split(">").pop()}
          </span>
          <h2
            style={{
              fontSize: "20px",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            {pickedStore.title}
          </h2>
          <div
            style={{ fontSize: "12px", color: "#888", marginBottom: "25px" }}
          >
            {pickedStore.category.replace(/>/g, " > ")}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setPickedStore(null)}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid #ddd",
                background: "white",
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
                padding: "12px",
                borderRadius: "12px",
                fontWeight: "bold",
                display: "block",
                fontSize: "14px",
              }}
            >
              길찾기
            </a>
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          bottom: "50px",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          zIndex: 100,
        }}
      >
        <button
          onClick={rollMenu}
          disabled={isRolling}
          style={{
            width: "220px",
            height: "65px",
            borderRadius: "35px",
            border: "none",
            background: isRolling ? "#ccc" : "#ff4757",
            color: "white",
            fontSize: "20px",
            fontWeight: "bold",
            boxShadow: "0 8px 25px rgba(255, 71, 87, 0.4)",
            cursor: "pointer",
          }}
        >
          {isRolling ? "고르는 중..." : `🎲 ${selectedCategory} 뽑기`}
        </button>
      </div>

      {NCP_MAPS_CLIENT_ID && (
        <Script
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NCP_MAPS_CLIENT_ID}&submodules=geocoder`}
          onLoad={() => setScriptLoaded(true)}
        />
      )}
    </div>
  );
}
