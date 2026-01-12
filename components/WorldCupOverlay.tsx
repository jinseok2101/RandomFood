import React from "react";
import { getCategoryColor } from "../utils/MapUtils";

interface WorldCupProps {
  currentMatch: [any, any];
  roundInfo: string;
  onSelect: (winner: any) => void;
  onClose: () => void;
}

export const WorldCupOverlay = ({
  currentMatch,
  roundInfo,
  onSelect,
  onClose,
}: WorldCupProps) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        backgroundColor: "#fff",
        flexDirection: "row", // 가로로 두 칸 나눔
      }}
    >
      {/* 상단 라운드 정보 (16강, 8강 등) */}
      <div
        style={{
          position: "absolute",
          top: "40px",
          width: "100%",
          textAlign: "center",
          zIndex: 100,
        }}
      >
        <div
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            color: "#fff",
            display: "inline-block",
            padding: "10px 25px",
            borderRadius: "30px",
            fontWeight: "bold",
            fontSize: "18px",
            backdropFilter: "blur(4px)",
          }}
        >
          {roundInfo}
        </div>
      </div>

      {currentMatch.map((store, idx) => (
        <div
          key={idx}
          onClick={() => onSelect(store)}
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            overflow: "hidden", // 이미지 튀어나감 방지
          }}
        >
          {/* ⭐ 배경 이미지 영역 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url(${store.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              transition: "transform 0.5s ease",
            }}
            // 마우스 올렸을 때 살짝 커지는 효과 (선택 사항)
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />

          {/* 컨텐츠 영역 (텍스트 등) */}
          <div style={{ zIndex: 10, textAlign: "center", padding: "20px" }}>
            <div
              style={{
                background: getCategoryColor(store.category),
                color: "#fff",
                padding: "6px 15px",
                borderRadius: "20px",
                fontSize: "14px",
                fontWeight: "bold",
                marginBottom: "15px",
                display: "inline-block",
                boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
              }}
            >
              {store.category.split(">").pop()}
            </div>
            <h2
              style={{
                fontSize: "32px", // 이미지가 들어가므로 글씨를 더 크게
                fontWeight: "bold",
                color: "#fff", // 배경이 이미지이므로 흰색 글씨
                textShadow: "0 2px 10px rgba(0,0,0,0.8)", // 가독성을 위한 그림자
                wordBreak: "keep-all",
                margin: 0,
              }}
            >
              {store.title}
            </h2>
          </div>

          {/* 중앙 VS 표시 (첫 번째 아이템 오른쪽에 배치) */}
          {idx === 0 && (
            <div
              style={{
                position: "absolute",
                right: "-30px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "#fff",
                border: "4px solid #333",
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "black",
                fontSize: "20px",
                color: "#333",
                zIndex: 20,
                boxShadow: "0 0 20px rgba(0,0,0,0.2)",
              }}
            >
              VS
            </div>
          )}
        </div>
      ))}

      {/* 그만하기 버튼 */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          bottom: "30px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.2)",
          border: "1px solid rgba(255,255,255,0.5)",
          color: "#fff",
          padding: "8px 20px",
          borderRadius: "20px",
          backdropFilter: "blur(5px)",
          cursor: "pointer",
          zIndex: 100,
        }}
      >
        그만하기
      </button>
    </div>
  );
};
