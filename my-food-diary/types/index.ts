// src/types/index.ts (예시)

export interface Coords {
  lat: number; // 위도
  lng: number; // 경도
}

export interface Place {
  id: string;
  name: string;
  category: 'KOREAN' | 'CHINESE' | 'JAPANESE' | 'ETC';
  coords: Coords;
  avgRating: number;
  reviewCount: number;
  imageUrl: string;
  url?: string; // 👈 카카오맵 URL을 저장하기 위해 추가 (옵셔널)
}

export interface Review {
  id: string;
  placeId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  content: string;
  createdAt: string;
}