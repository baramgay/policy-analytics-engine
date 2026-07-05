// Kakao Maps SDK 싱글턴 로더 — <Script> 대신 useEffect에서 직접 주입해야 React 19 경고를 피할 수 있다
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kakao: any;
  }
}

let readyPromise: Promise<void> | null = null;

export function loadKakaoMaps(): Promise<void> {
  if (readyPromise) return readyPromise;

  readyPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      readyPromise = null;
      reject(new Error("Kakao Maps SDK는 브라우저에서만 로드할 수 있습니다"));
      return;
    }
    if (typeof window.kakao?.maps?.LatLng === "function") {
      resolve();
      return;
    }

    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
    script.onload = () => window.kakao.maps.load(resolve);
    script.onerror = () => {
      readyPromise = null;
      reject(new Error("Kakao Maps SDK 로드 실패"));
    };
    document.head.appendChild(script);
  });

  return readyPromise;
}
