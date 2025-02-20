import { useState, useEffect } from "react";
import { storage } from "../lib/firebase";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { useRecoilState, useRecoilValue, useResetRecoilState } from "recoil";
import {
  autoBrewingTransactionsState,
  completedSongsState,
  pendingRequestsState,
  selectedSongMetaState,
  selectedTransactionState,
} from "../atom";
import { Navigate, useNavigate } from "react-router-dom";
import { FirestoreService } from "../services/firestore.service";
import { webViewActions } from "../services/webView.service";

// songMeta 인터페이스 추가
interface SongMeta {
  preloadedThumbnails?: string[];
  audioUrl?: string;
  artwork: string | null;
}

const Edit2Page = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [totalArtistImageList, setTotalArtistImageList] = useState<string[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const selectedTransaction = useRecoilValue(selectedTransactionState);
  const songMeta = useRecoilValue<SongMeta | null>(
    selectedSongMetaState as any
  );

  const [completedSongs, setCompletedSongs] =
    useRecoilState(completedSongsState);
  const [pendingRequests, setPendingRequests] =
    useRecoilState(pendingRequestsState);
  const [autoBrewingTransactions, setAutoBrewingTransactions] = useRecoilState(
    autoBrewingTransactionsState
  );

  const resetTransaction = useResetRecoilState(selectedTransactionState);
  const resetSongMeta = useResetRecoilState(selectedSongMetaState);

  useEffect(() => {
    const fetchAlbumCovers = async () => {
      // 미리 로딩된 썸네일이 있는지 확인
      if (songMeta?.preloadedThumbnails) {
        setTotalArtistImageList(songMeta.preloadedThumbnails);
        return;
      }

      // 기존 로직은 미리 로딩된 썸네일이 없을 때만 실행
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
  }, [
    selectedTransaction?.existingArtist?.artistName,
    songMeta?.preloadedThumbnails,
  ]);
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
      const newSong = await FirestoreService.addNewSong({
        artistId: selectedTransaction.existingArtist?.artistId || "",
        artistName: selectedTransaction.artistName,
        title: selectedTransaction.songTitle,
        thumbnailUrl: selectedThumbnailUrl,
        youtubeId: "",
        tagList: selectedTransaction.existingArtist?.tagList || [],
        isAI: true,
        makerUserId: selectedTransaction.userName,
        tag: {
          genreList: selectedTransaction.existingArtist?.tag.genreList || [],
          tagList: selectedTransaction.existingArtist?.tagList || [],
        },
        url: songMeta.audioUrl || undefined,
      });

      setCompletedSongs([newSong, ...completedSongs]);
      setPendingRequests(
        pendingRequests.filter(
          (req) => req.songRequestId !== selectedTransaction?.songRequestId
        )
      );
      setAutoBrewingTransactions(
        autoBrewingTransactions.map((trans) =>
          trans.transactionId === selectedTransaction?.transactionId
            ? { ...trans, status: "completed", songId: newSong.songId }
            : trans
        )
      );

      // 2. songRequest 관련 업데이트
      // 3. AutoBrewingTransaction 상태 업데이트
      await Promise.all([
        FirestoreService.updateSongRequestToComplete({
          songRequestId: selectedTransaction.songRequestId,
          userId: selectedTransaction.userId,
          newSongId: newSong.songId,
        }),
        FirestoreService.updateBrewingTransactionStatus(
          selectedTransaction.transactionId,
          newSong.songId,
          "completed"
        ),
      ]);

      setIsLoading(false);
      setIsCompleted(true);
      setTimeout(() => {
        webViewActions.pressSong(newSong);
      }, 500);
    } catch (error) {
      console.error("곡 추가 실패:", error);

      // 에러 메시지 생성
      let errorMessage = "알 수 없는 오류가 발생했습니다.";
      if (error instanceof Error) {
        errorMessage = `오류 발생: ${error.message}`;
        // Firebase 에러의 경우 추가 정보 표시
        if ("code" in error) {
          errorMessage += `\n에러 코드: ${(error as any).code}`;
        }
      }

      if (selectedTransaction) {
        try {
          await FirestoreService.updateBrewingTransactionStatus(
            selectedTransaction.transactionId,
            "",
            "failed",
            errorMessage
          );
        } catch (updateError) {
          console.error("상태 업데이트 실패:", updateError);
          errorMessage += "\n상태 업데이트도 실패했습니다.";
        }
      }

      alert(errorMessage);
      setIsLoading(false);
    }
  };

  const handleNavigateToHome = () => {
    resetTransaction();
    resetSongMeta();
    navigate(-2);
    window.history.replaceState(null, "", "/");
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Status Modal */}
      {(isLoading || isCompleted) && (
        <StatusModal isLoading={isLoading} onComplete={handleNavigateToHome} />
      )}

      {/* Scrollable Content Area - 헤더를 포함한 전체 영역이 스크롤됨 */}
      <div className="h-full overflow-y-auto custom-scrollbar">
        {/* Header Section */}
        <div className="p-5">
          <div className="mb-8">
            <h1 className="text-lg mb-0.5 text-white">앨범 커버 선택</h1>
            <p className="text-sm text-neutral-400">
              마음에 드는 이미지를 선택해주세요!
            </p>
          </div>
        </div>

        {/* Grid Content */}
        <div className="px-5">
          <div className="grid grid-cols-2 gap-4 pb-24">
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
                {cover === "default" ? (
                  <div className="h-full w-full bg-neutral-900 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-neutral-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                  </div>
                ) : (
                  <img
                    src={cover}
                    alt={`앨범 커버 ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                )}
                {selectedImage === index && (
                  <div className="absolute inset-0 bg-yellow-400 bg-opacity-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Button Area */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-black via-black to-transparent pb-5 pt-10">
        <button
          onClick={handleComplete}
          disabled={selectedImage === null || isLoading || isCompleted}
          className={`mx-5 w-[calc(100%-40px)] rounded-xl py-4 text-base font-bold
            ${
              selectedImage === null || isLoading || isCompleted
                ? "cursor-not-allowed bg-neutral-600 opacity-50"
                : "cursor-pointer bg-yellow-400"
            }`}
        >
          완성곡 받기
        </button>
      </div>
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

export default Edit2Page;
