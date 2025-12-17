import { Place } from '../types';

export const mockPlaces: Place[] = [
  {
    id: 'p101',
    name: '아늑한 커피집',
    category: 'ETC',
    coords: { lat: 37.2785, lng: 127.1590 }, // 현재 위치 근처
    avgRating: 4.5,
    reviewCount: 150,
    imageUrl: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Cafe',
  },
  {
    id: 'p102',
    name: '전통 비빔밥 맛집',
    category: 'KOREAN',
    coords: { lat: 37.2760, lng: 127.1550 }, // 조금 떨어진 곳
    avgRating: 4.8,
    reviewCount: 320,
    imageUrl: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=Bibimbap',
  },
  {
    id: 'p103',
    name: '일본식 라멘 전문점',
    category: 'JAPANESE',
    coords: { lat: 37.2800, lng: 127.1620 },
    avgRating: 4.2,
    reviewCount: 90,
    imageUrl: 'https://via.placeholder.com/150/00FF00/FFFFFF?text=Ramen',
  },
  // 프로젝트를 진행하면서 데이터를 더 추가해 보세요.
];