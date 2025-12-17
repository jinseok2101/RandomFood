declare namespace naver.maps {
  // 1. 기본 클래스들
  export class LatLng { 
    constructor(lat: number, lng: number); 
    lat(): number; 
    lng(): number; 
  }
  export class Point { constructor(x: number, y: number); }
  export class Size { constructor(width: number, height: number); }
  export class Map { 
    constructor(mapDiv: HTMLElement | string, mapOptions: MapOptions); 
    getCenter(): LatLng;
    setCenter(latlng: LatLng): void;
    panTo(latlng: LatLng): void;
  }
  // types/naver.d.ts 파일에서 이 부분을 찾아 수정하세요.
export interface MapOptions { 
  center: LatLng; 
  zoom: number; 
  mapTypeId?: string; // 💡 '?'를 추가하여 선택 사항으로 변경
}
  export class Marker { 
    constructor(options: any); 
    setMap(map: Map | null): void; 
  }

  export class InfoWindow {
    constructor(options: any);
    open(map: Map, anchor: Marker | LatLng): void;
    close(): void;
    setContent(content: string | HTMLElement): void;
  }

  // 2. Property 'Service' 에러 해결
  export namespace Service {
    export enum Status { OK = 'OK', ERROR = 'ERROR' }
    export function reverseGeocode(options: any, callback: (status: Status, response: any) => void): void;
  }

  // 3. Property 'MapTypeId' 에러 해결
  export const MapTypeId: {
    NORMAL: string;
    TERRAIN: string;
    SATELLITE: string;
    HYBRID: string;
  };

  // 4. Property 'Event' 에러 해결
  export namespace Event {
    export function once(target: any, type: string, listener: () => void): void;
    export function addListener(target: any, type: string, listener: (e?: any) => void): void;
    export function removeListener(listener: any): void;
  }
}

// 전역 변수 naver에 대한 타입 정의
declare const naver: {
  maps: typeof naver.maps;
};