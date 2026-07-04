"use client";

// 분석 엔진이 감지한 MapSpec을 MapLibre GL로 표시만 하는 순수 렌더러 (좌표 판별 로직은 lib/analytics/mapDetector가 담당)
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapSpec } from "@/types/analysis";

const GYEONGNAM_CENTER: [number, number] = [128.2132, 35.2601];

export function AnalysisMap({ spec }: { spec: MapSpec }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: GYEONGNAM_CENTER,
      zoom: 8,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers: maplibregl.Marker[] = [];
    const applyMarkers = () => {
      for (const point of spec.points) {
        const marker = new maplibregl.Marker({ color: "#3b82f6" })
          .setLngLat([point.lng, point.lat])
          .setPopup(new maplibregl.Popup({ offset: 16 }).setText(point.label))
          .addTo(map);
        markers.push(marker);
      }
    };

    if (map.isStyleLoaded()) {
      applyMarkers();
    } else {
      map.once("load", applyMarkers);
    }

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [spec.points]);

  if (!spec.detected || spec.points.length === 0) {
    return (
      <div style={{ padding: 24, color: "#9ca3af", fontSize: 13 }}>
        지도로 표시할 위치 정보가 감지되지 않았습니다.
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: "100%", height: 360, borderRadius: 8 }} />;
}
