import { useState, useEffect } from "react";
import styled from "styled-components";
import { storage } from "../lib/firebase";
import { ref, listAll, getDownloadURL } from "firebase/storage";

const SelectAlbumCoverPage = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [albumCovers, setAlbumCovers] = useState<string[]>([]);

  useEffect(() => {
    const fetchAlbumCovers = async () => {
      try {
        const thumbnailsRef = ref(storage, "artistThumbnail/임재범");
        const result = await listAll(thumbnailsRef);
        const urlPromises = result.items.map((imageRef) =>
          getDownloadURL(imageRef)
        );
        const urls = await Promise.all(urlPromises);
        setAlbumCovers(urls);
      } catch (error) {
        console.error("썸네일 이미지 가져오기 실패:", error);
      }
    };

    fetchAlbumCovers();
  }, []);

  const handleImageClick = (index: number) => {
    setSelectedImage(index);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* 헤더 */}
      <h2 className="py-6 text-center text-xl font-semibold text-white">
        앨범 커버를 골라주세요!
      </h2>

      {/* 그리드 컨테이너 */}
      <div className="h-[calc(100vh-180px)] px-5">
        <div className="grid h-full auto-rows-max grid-cols-2 gap-x-4 gap-y-8 overflow-y-auto pb-24">
          {albumCovers.map((cover, index) => (
            <div
              key={index}
              onClick={() => handleImageClick(index)}
              className={`relative aspect-[16/9] w-full cursor-pointer overflow-hidden rounded-lg 
                ${
                  selectedImage === index
                    ? "outline outline-3 outline-yellow-400 -outline-offset-3"
                    : ""
                }`}
            >
              <img
                src={cover}
                alt={`앨범 커버 ${index + 1}`}
                className="h-full w-full object-cover"
              />
              {selectedImage === index && (
                <div className="absolute inset-0 bg-yellow-400 bg-opacity-10" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 하단 버튼 */}
      <button className="fixed bottom-4 left-4 right-4 z-10 rounded-lg bg-yellow-400 px-4 py-4 text-base font-semibold text-black">
        곡 수령하기
      </button>
    </div>
  );
};
export default SelectAlbumCoverPage;
