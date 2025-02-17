// SongImage.tsx
import React, { useState } from "react";

export const SongItemSkeleton = () => (
  <div className="flex items-center gap-3 animate-pulse">
    <div className="flex items-center flex-1 min-w-0">
      <div className="w-[100px] h-[56px] rounded overflow-hidden shrink-0 bg-neutral-800"></div>
      <div className="flex-1 min-w-0 ml-3">
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className="h-[18px] bg-neutral-800 rounded w-36"></div>
          <div className="shrink-0 w-6 h-[18px] bg-neutral-700 rounded"></div>
        </div>
        <div className="h-[16px] bg-neutral-800 rounded w-24"></div>
      </div>
    </div>
    <div className="shrink-0 w-10 h-10 rounded-full bg-neutral-800"></div>
  </div>
);

export const RequestItemSkeleton = () => (
  <div className="flex items-center gap-3 bg-neutral-900 p-3 rounded-lg animate-pulse">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-0.5">
        <div className="h-[18px] bg-neutral-800 rounded w-36"></div>
      </div>
      <div className="h-[16px] bg-neutral-800 rounded w-24"></div>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <div className="w-16 h-[14px] bg-neutral-800 rounded"></div>
      <div className="w-12 h-[22px] bg-neutral-800 rounded-md"></div>
    </div>
  </div>
);

interface SongImageProps {
  thumbnailUrl?: string;
  artwork?: string;
  title: string;
}

export const SongImage: React.FC<SongImageProps> = ({
  thumbnailUrl,
  artwork,
  title,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const imageUrl = thumbnailUrl || artwork;

  return (
    <div className="w-[100px] h-[56px] rounded overflow-hidden shrink-0 relative bg-neutral-800">
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
      )}
      <img
        src={imageUrl}
        alt={title}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)} // 이미지 로드 실패시에도 로딩 상태 해제
      />
    </div>
  );
};
