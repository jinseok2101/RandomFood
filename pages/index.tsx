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

  // 월드컵 관련 상태
  const [worldCupMode, setWorldCupMode] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [round, setRound] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [currentMatch, setCurrentMatch] = useState<[any, any] | null>(null);

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

  const checkCategory = (itemCat: string, selectedCat: string) => {
    if (selectedCat === "전체") return true;
    const catMap: { [key: string]: string[] } = {
      한식: ["한식", "김밥", "갈비", "삼겹살", "육류", "고기", "분식"],
      일식: ["일식", "스시", "초밥", "돈가스", "돈까스"],
      중식: ["중식", "짜장", "짬뽕", "마라탕"],
      양식: ["양식", "파스타", "스테이크"],
      카페: ["카페", "커피", "빵", "베이커리", "디저트"],
      분식: ["분식", "떡볶이", "오뎅", "어묵", "튀김"],
      패스트푸드: ["햄버거", "버거", "피자", "도넛", "패스트푸드"],
    };
    return (
      catMap[selectedCat]?.some((k) => itemCat.includes(k)) ||
      itemCat.includes(selectedCat)
    );
  };

  const getCategoryColor = (category: string) => {
    for (const cat of categories) {
      if (cat !== "전체" && checkCategory(category, cat))
        return categoryStyles[cat];
    }
    return categoryStyles["기타"];
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
                address + " " + k
              )}&display=50`
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
              const cleanTitle = item.title.replace(/<[^>]*>?/gm, "");
              const marker = new (window as any).naver.maps.Marker({
                position: new (window as any).naver.maps.LatLng(mLat, mLng),
                map: checkCategory(item.category, selectedCategory)
                  ? map
                  : null,
                icon: {
                  content: `<div style="width:14px; height:14px; background:${getCategoryColor(
                    item.category
                  )}; border:2px solid white; border-radius:50%; box-shadow:0 2px 4px rgba(0,0,0,0.3); cursor:pointer;"></div>`,
                  anchor: new (window as any).naver.maps.Point(7, 7),
                },
              });
              (window as any).naver.maps.Event.addListener(
                marker,
                "click",
                () => {
                  setPickedStore({
                    title: cleanTitle,
                    category: item.category,
                    url: `https://map.naver.com/v5/search/${encodeURIComponent(
                      cleanTitle
                    )}`,
                  });
                }
              );
              marker.set("title", cleanTitle);
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

  // 🏆 월드컵 시작 로직
  const startWorldCup = () => {
    const center = mapInstance.current?.getCenter();
    const available = markersRef.current
      .filter(
        (m) =>
          m.getMap() !== null &&
          mapInstance.current
            .getProjection()
            .getDistance(center, m.getPosition()) <= radius
      )
      .map((m) => ({
        title: m.get("title"),
        category: m.get("category"),
        url: `https://map.naver.com/v5/search/${encodeURIComponent(
          m.get("title")
        )}`,
      }));

    if (available.length < 4)
      return alert(
        "월드컵을 하려면 주변에 식당이 최소 4개 이상 있어야 합니다."
      );

    const shuffled = available.sort(() => 0.5 - Math.random()).slice(0, 8); // 최대 8강
    setCandidates(shuffled);
    setRound(shuffled);
    setWinners([]);
    setCurrentMatch([shuffled[0], shuffled[1]]);
    setWorldCupMode(true);
  };

  const selectWinner = (winner: any) => {
    const nextWinners = [...winners, winner];
    setWinners(nextWinners);

    if (round.length <= 2) {
      if (nextWinners.length === 1) {
        // 최종 우승
        setPickedStore(winner);
        setWorldCupMode(false);
      } else {
        // 다음 라운드 진출
        const nextRound = nextWinners;
        setRound(nextRound);
        setWinners([]);
        setCurrentMatch([nextRound[0], nextRound[1]]);
      }
    } else {
      const nextRound = round.slice(2);
      setRound(nextRound);
      setCurrentMatch([nextRound[0], nextRound[1]]);
    }
  };

  const rollMenu = () => {
    const center = mapInstance.current?.getCenter();
    const available = markersRef.current.filter(
      (m) =>
        m.getMap() !== null &&
        mapInstance.current
          .getProjection()
          .getDistance(center, m.getPosition()) <= radius
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
          url: `https://map.naver.com/v5/search/${encodeURIComponent(
            target.get("title")
          )}`,
        });
      }
    }, 120);
  };

  useEffect(() => {
    if (!scriptLoaded || !window.naver || mapInstance.current) return;
    const map = new (window as any).naver.maps.Map(mapRef.current!, {
      center: new (window as any).naver.maps.LatLng(37.5546, 126.9706),
      zoom: 17,
    });
    mapInstance.current = map;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const myPos = new (window as any).naver.maps.LatLng(
          p.coords.latitude,
          p.coords.longitude
        );
        map.setCenter(myPos);
        myMarkerRef.current = new (window as any).naver.maps.Marker({
          position: myPos,
          map,
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
        backgroundColor: "#f0f2f5",
      }}
    >
      <Head>
        <title>오늘 뭐 먹지?</title>
      </Head>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          visibility: worldCupMode ? "hidden" : "visible",
        }}
      />

      {/* 월드컵 UI */}
      {worldCupMode && currentMatch && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2000,
            display: "flex",
            backgroundColor: "#fff",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "40px",
              width: "100%",
              textAlign: "center",
              zIndex: 10,
            }}
          >
            <div
              style={{
                background: "#333",
                color: "#fff",
                display: "inline-block",
                padding: "10px 25px",
                borderRadius: "30px",
                fontWeight: "bold",
                fontSize: "18px",
              }}
            >
              {winners.length + 1} /{" "}
              {Math.ceil((round.length + winners.length) / 2)} 대결
            </div>
          </div>
          {currentMatch.map((store, idx) => (
            <div
              key={idx}
              onClick={() => selectWinner(store)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.3s",
                borderRight: idx === 0 ? "2px solid #eee" : "none",
                position: "relative",
                padding: "20px",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#fdf2f2")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#fff")
              }
            >
              <div
                style={{
                  background: getCategoryColor(store.category),
                  color: "#fff",
                  padding: "6px 15px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "15px",
                }}
              >
                {store.category.split(">").pop()}
              </div>
              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: "black",
                  textAlign: "center",
                  wordBreak: "keep-all",
                }}
              >
                {store.title}
              </h2>
              {idx === 0 && (
                <div
                  style={{
                    position: "absolute",
                    right: "-30px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "#fff",
                    border: "2px solid #eee",
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "20px",
                    color: "#ff4757",
                    zIndex: 20,
                  }}
                >
                  VS
                </div>
              )}
            </div>
          ))}
          <button
            onClick={() => setWorldCupMode(false)}
            style={{
              position: "absolute",
              bottom: "40px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "none",
              border: "none",
              color: "#888",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            그만하기
          </button>
        </div>
      )}

      {!worldCupMode && (
        <>
          {/* 상단 UI */}
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
                    markersRef.current.forEach((m) =>
                      m.setMap(
                        checkCategory(m.get("category"), cat)
                          ? mapInstance.current
                          : null
                      )
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

          {/* 메인 액션 버튼 */}
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
              onClick={startWorldCup}
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
              🏆 점심 메뉴 월드컵 시작
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
            padding: "30px",
            borderRadius: "25px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            zIndex: 3000,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              color: "#ff4757",
              marginBottom: "5px",
            }}
          >
            {worldCupMode ? "" : "오늘의 추천!"}
          </div>
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
              fontSize: "24px",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            {pickedStore.title}
          </h2>
          <div
            style={{ fontSize: "13px", color: "#888", marginBottom: "30px" }}
          >
            {pickedStore.category.replace(/>/g, " > ")}
          </div>
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
