import { useState, useEffect } from "react";
import { storage } from "../lib/firebase";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { useRecoilValue, useResetRecoilState } from "recoil";
import { selectedSongMetaState, selectedTransactionState } from "../atom";
import { addNewSong } from "../services/songService";
import { useNavigate } from "react-router-dom";
import {
  updateBrewingTransactionStatus,
  updateSongRequestToComplete,
} from "../services/songRequestService";

const EditPage2 = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [totalArtistImageList, setTotalArtistImageList] = useState<string[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const selectedTransaction = useRecoilValue(selectedTransactionState);
  const songMeta = useRecoilValue(selectedSongMetaState);

  const resetTransaction = useResetRecoilState(selectedTransactionState);
  const resetSongMeta = useResetRecoilState(selectedSongMetaState);

  useEffect(() => {
    const fetchAlbumCovers = async () => {
      try {
        const thumbnailsRef = ref(
          storage,
          `artistThumbnail/${selectedTransaction?.existingArtist?.artistName}`
        );
        const result = await listAll(thumbnailsRef);
        const urlPromises = result.items.map((imageRef) =>
          getDownloadURL(imageRef)
        );
        const urls = await Promise.all(urlPromises);
        setTotalArtistImageList(urls);
      } catch (error) {
        console.error("썸네일 이미지 가져오기 실패:", error);
      }
    };

    fetchAlbumCovers();
  }, [selectedTransaction?.existingArtist?.artistName]);
  // 페이지 마운트 시 필수 정보 체크

  const handleImageClick = (index: number) => {
    setSelectedImage(index);
  };

  const handleComplete = async () => {
    // 실행 시점에서도 한번 더 체크
    if (!selectedTransaction || !songMeta || selectedImage === null) {
      const missingInfo = [];
      if (!selectedTransaction) missingInfo.push("선택된 트랜잭션 정보");
      if (!songMeta) missingInfo.push("곡 메타 정보");
      if (selectedImage === null) missingInfo.push("선택된 이미지");

      alert(`다음 정보가 누락되었습니다:\n${missingInfo.join("\n")}`);
      return;
    }

    setIsLoading(true);
    try {
      const selectedThumbnailUrl = totalArtistImageList[selectedImage];

      // 1. 곡 추가
      const newSongId = await addNewSong({
        artistId: selectedTransaction.existingArtist?.artistId || "",
        artistName: selectedTransaction.artistName,
        title: selectedTransaction.songTitle,
        thumbnailUrl: selectedThumbnailUrl,
        youtubeId: "",
        tagList: selectedTransaction.existingArtist?.tagList || [],
        isAI: true,
        makerUserId: selectedTransaction.userId,
        tag: {
          genreList: selectedTransaction.existingArtist?.tag.genreList || [],
          tagList: selectedTransaction.existingArtist?.tagList || [],
        },
        url: songMeta.audioUrl || undefined,
      });

      // 2. songRequest 관련 업데이트
      await updateSongRequestToComplete({
        songRequestId: selectedTransaction.songRequestId,
        userId: selectedTransaction.userId,
        newSongId,
      });

      // 3. AutoBrewingTransaction 상태 업데이트
      await updateBrewingTransactionStatus(
        selectedTransaction.transactionId,
        newSongId,
        "completed"
      );

      console.log(
        `${{
          artistId: selectedTransaction.existingArtist?.artistId || "",
          artistName: selectedTransaction.artistName,
          title: selectedTransaction.songTitle,
          thumbnailUrl: selectedThumbnailUrl,
          youtubeId: "",
          tagList: selectedTransaction.existingArtist?.tagList || [],
          isAI: true,
          makerUserId: selectedTransaction.userId,
          tag: {
            genreList: selectedTransaction.existingArtist?.tag.genreList || [],
            tagList: selectedTransaction.existingArtist?.tagList || [],
          },
          url: songMeta.audioUrl || undefined,
        }}`
      );

      setIsLoading(false);
      setIsCompleted(true);
    } catch (error) {
      console.error("곡 추가 실패:", error);
      if (selectedTransaction) {
        try {
          await updateBrewingTransactionStatus(
            selectedTransaction.transactionId,
            "",
            "failed",
            error instanceof Error
              ? error.message
              : "알 수 없는 오류가 발생했습니다."
          );
        } catch (updateError) {
          console.error("상태 업데이트 실패:", updateError);
        }
      }
      alert("곡 추가에 실패했습니다.");
      setIsLoading(false);
    }
  };

  const handleNavigateToHome = () => {
    resetTransaction();
    resetSongMeta();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-black">
      {(isLoading || isCompleted) && (
        <StatusModal isLoading={isLoading} onComplete={handleNavigateToHome} />
      )}

      <h2 className="py-6 text-center text-xl font-semibold text-white">
        앨범 커버를 골라주세요!
      </h2>

      <div className="h-[calc(100vh-180px)] px-5">
        <div className="grid h-full auto-rows-max grid-cols-2 gap-x-4 gap-y-8 overflow-y-auto pb-24">
          {totalArtistImageList.map((cover, index) => (
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

      <button
        onClick={handleComplete}
        disabled={selectedImage === null || isLoading || isCompleted}
        className={`fixed bottom-4 left-4 right-4 z-10 rounded-lg px-4 py-4 text-base font-semibold
          ${
            selectedImage === null || isLoading || isCompleted
              ? "bg-gray-400 text-gray-600"
              : "bg-yellow-400 text-black"
          }`}
      >
        완성곡 받기
      </button>
    </div>
  );
};

const StatusModal = ({
  isLoading,
  onComplete,
}: {
  isLoading: boolean;
  onComplete: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-lg bg-zinc-900 p-6 text-center border border-zinc-700">
        {isLoading ? (
          <>
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent mx-auto"></div>
            <p className="text-lg font-semibold text-white">
              곡을 생성하는 중입니다...
            </p>
          </>
        ) : (
          <>
            <div className="mb-4 h-12 w-12 mx-auto text-yellow-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold mb-4 text-white">
              곡이 성공적으로 생성되었습니다!
            </p>
            <button
              onClick={onComplete}
              className="w-full rounded-lg bg-yellow-400 px-4 py-3 text-base font-semibold text-black hover:bg-yellow-500 transition-colors"
            >
              확인
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EditPage2;
