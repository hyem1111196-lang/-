import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// 코레일 작업현장 AI 기상정보 대응시스템
// PWA: 설치 없이 홈화면 추가 + 오프라인 셸/가이드 캐시 (현장 네트워크 불안정 대비)
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "fonts/*.woff2"],
      manifest: {
        name: "코레일 작업현장 AI 기상정보 대응시스템",
        short_name: "기상안전 대응",
        description:
          "코레일 옥외 작업현장의 폭염·호우·폭설·한파 기상정보와 단계별 안전조치를 한 화면에서. 전사 활용.",
        theme_color: "#0066B3",
        background_color: "#0b1f3a",
        display: "standalone",
        orientation: "portrait",
        lang: "ko",
        start_url: "/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,json}"],
        // 기상 API 응답은 짧게 캐시(현장 즉시성), 정적 가이드는 길게
        runtimeCaching: [
          {
            urlPattern: /\/api\/weather.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "weather-api",
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 10 },
            },
          },
        ],
      },
    }),
  ],
  server: { port: 5173, host: true },
});

