"use client";

// 분석 엔진이 감지한 MapSpec을 카카오맵으로 표시만 하는 순수 렌더러 (좌표 판별 로직은 lib/analytics/mapDetector가 담당)
import { useEffect, useRef } from "react";
import type { MapSpec } from "@/types/analysis";
import { loadKakaoMaps } from "@/lib/kakaoMaps";

const GYEONGNAM_CENTER = { lat: 35.2601, lng: 128.2132 };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeMarkerImage(kakao: any) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26">` +
      `<circle cx="13" cy="13" r="11" fill="#3b82f6" stroke="white" stroke-width="2.5"/>` +
      `</svg>`,
  );
  return new kakao.maps.MarkerImage(
    `data:image/svg+xml,${svg}`,
    new kakao.maps.Size(26, 26),
    { offset: new kakao.maps.Point(13, 13) },
  );
}

export function AnalysisMap({ spec }: { spec: MapSpec }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clustererRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    function applyMarkers() {
      const map = mapRef.current;
      const kakao = window.kakao;
      if (!map || !kakao) return;

      if (clustererRef.current) {
        clustererRef.current.clear();
      }
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      for (const point of spec.points) {
        const position = new kakao.maps.LatLng(point.lat, point.lng);
        const marker = new kakao.maps.Marker({
          position,
          image: makeMarkerImage(kakao),
        });

        const infoWindow = new kakao.maps.InfoWindow({
          content: `<div style="padding:6px 10px;font-size:12px;">${point.label}</div>`,
        });
        kakao.maps.event.addListener(marker, "click", () => {
          infoWindow.open(map, marker);
        });

        markersRef.current.push(marker);
      }

      // 카카오맵 SDK의 MarkerClusterer가 로드되어 있으면 줌 레벨에 따라 근접 마커를 자동으로 묶어준다.
      // 로드되지 않은 환경(SDK 버전 차이 등)에서는 개별 마커를 그대로 지도에 표시하는 방식으로 대체한다.
      if (kakao.maps.MarkerClusterer) {
        clustererRef.current = new kakao.maps.MarkerClusterer({
          map,
          markers: markersRef.current,
          averageCenter: true,
          minLevel: 6,
          gridSize: 60,
        });
      } else {
        markersRef.current.forEach((marker) => marker.setMap(map));
      }
    }

    loadKakaoMaps().then(() => {
      if (cancelled || !containerRef.current) return;
      const kakao = window.kakao;
      if (!mapRef.current) {
        mapRef.current = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(GYEONGNAM_CENTER.lat, GYEONGNAM_CENTER.lng),
          level: 9,
        });
        mapRef.current.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
      }
      applyMarkers();
    });

    return () => {
      cancelled = true;
    };
  }, [spec.points]);

  useEffect(() => {
    return () => {
      if (clustererRef.current) {
        clustererRef.current.clear();
        clustererRef.current = null;
      }
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      mapRef.current = null;
    };
  }, []);

  if (!spec.detected || spec.points.length === 0) {
    return (
      <div style={{ padding: 24, color: "#9ca3af", fontSize: 13 }}>
        지도로 표시할 위치 정보가 감지되지 않았습니다.
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: "100%", height: 360, borderRadius: 8 }} />;
}
