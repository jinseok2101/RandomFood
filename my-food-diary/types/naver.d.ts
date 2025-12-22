declare namespace naver.maps {
  export class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }
  export class Point {
    constructor(x: number, y: number);
  }
  export class Size {
    constructor(width: number, height: number);
  }

  export class Map {
    constructor(mapDiv: HTMLElement | string, mapOptions: MapOptions);
    getCenter(): LatLng;
    setCenter(latlng: LatLng): void;
    panTo(latlng: LatLng): void;
    getBounds(): any;
    // 💡 거리 계산을 위해 필요한 메서드 추가
    getProjection(): MapSystemProjection;
  }

  export interface MapSystemProjection {
    getDistance(lastPos: LatLng, nextPos: LatLng): number;
  }

  export interface MapOptions {
    center: LatLng;
    zoom: number;
    mapTypeId?: string;
    minZoom?: number;
    maxZoom?: number;
    logoControl?: boolean; // 💡 추가
    mapDataControl?: boolean; // 💡 추가
    zoomControl?: boolean; // 💡 추가
    scaleControl?: boolean; // 💡 추가
  }

  export class Marker {
    constructor(options: any);
    setMap(map: Map | null): void;
    getMap(): Map | null;
    setPosition(latlng: LatLng): void;
    getPosition(): LatLng;
    set(key: string, value: any): void; // 💡 추가
    get(key: string): any; // 💡 추가
  }
  export class InfoWindow {
    constructor(options: any);

    open(map: Map, anchor: Marker | LatLng): void;

    close(): void;

    setContent(content: string | HTMLElement): void;
  }

  export namespace Service {
    export enum Status {
      OK = "OK",
      ERROR = "ERROR",
    }

    export function reverseGeocode(
      options: any,
      callback: (status: Status, response: any) => void
    ): void;
  }

  export const MapTypeId: {
    NORMAL: string;

    TERRAIN: string;

    SATELLITE: string;

    HYBRID: string;
  };

  // 🔔 Event 네임스페이스 업데이트

  export namespace Event {
    export function once(target: any, type: string, listener: () => void): void;

    export function addListener(
      target: any,
      type: string,
      listener: (e?: any) => void
    ): void;

    export function trigger(target: any, type: string, ...args: any[]): void; // 💡 trigger 추가
  }
}

declare const naver: {
  maps: typeof naver.maps;
};
