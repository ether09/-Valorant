import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // experimental 안이 아니라, 여기에 직접 작성해야 합니다.
  allowedDevOrigins: ['25.22.78.20', 'localhost:3000'],
  
  // 기존 설정이 있다면 유지
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;