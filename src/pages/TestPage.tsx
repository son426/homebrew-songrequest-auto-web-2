import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Song,
  SongRequest,
  Status,
  AutoBrewingTransaction,
} from "../types/schema";
import { useRecoilState } from "recoil";
import {
  autoBrewingTransactionsState,
  completedSongsState,
  isFirstFetchState,
  pendingRequestsState,
  selectedTransactionState,
  userState,
} from "../atom";
import { webViewActions } from "../services/webView.service";
import { FirestoreService } from "../services/firestore.service";
import { useModal } from "../components/modal/useModal";
import {
  RequestItemSkeleton,
  SongImage,
  SongItemSkeleton,
} from "../components/home/skeleton";
import SongRequestModalContent from "./home/components/SongRequestModalContent";

// const DUMMY_USER_ID = "ozoJE7tyarOZprogC2ezRAOavlt2";
// 개발할때는 더미유저 넣고 개발. 배포할때는 DUMMY_USER_ID 비우고 사용.
const DUMMY_USER_ID = "";
const WEBVIEW_USER_TIMEOUT_MS = 3000;

const TestPage: React.FC = () => {
  const location = useLocation();

  const [completedSongs, setCompletedSongs] =
    useRecoilState(completedSongsState);
  const [failedPendingOrErrorRequests, setFailedPendingOrErrorRequests] =
    useRecoilState(pendingRequestsState);
  const [autoBrewingTransactions, setAutoBrewingTransactions] = useRecoilState(
    autoBrewingTransactionsState
  );
  const [userInfo, setUserInfo] = useRecoilState(userState);
  const [isFirstFetch, setIsFirstFetch] = useRecoilState(isFirstFetchState);

  const [selectedTransaction, setSelectedTransaction] = useRecoilState(
    selectedTransactionState
  );

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();

  // 데이터 fetch
  useEffect(() => {
    const fetchData = async () => {
      if (!isFirstFetch) return; // 첫 fetch가 아니면 skip

      setIsDataLoading(true);
      const userId = userInfo?.userId || DUMMY_USER_ID;
      console.log("userId : ", userId);
      if (!userId) return;
      try {
        // alert("Firestore 데이터 fetching 시작");

        const [songRequestsData, brewingTransactions] = await Promise.all([
          FirestoreService.getSongRequests(userId),
          FirestoreService.getBrewingTransactions(
            userInfo?.userId || DUMMY_USER_ID
          ),
        ]);

        console.log(songRequestsData);
        console.log(brewingTransactions);
        // alert("SongRequests와 BrewingTransactions 로드 완료");

        setAutoBrewingTransactions(brewingTransactions);
        setFailedPendingOrErrorRequests(songRequestsData.pendingRequests);

        try {
          const completedSongs = await FirestoreService.getCompletedSongs(
            songRequestsData.completedSongIds
          );
          console.log("completedSongs : ", completedSongs);
          // alert("CompletedSongs 로드 완료");
          setCompletedSongs(completedSongs);
        } catch (error) {
          // alert("CompletedSongs 로드 실패: " + error);
        }
      } catch (error) {
        // alert("Firestore 데이터 fetching 실패: " + error);

        console.error("Error fetching data:", error);
      } finally {
        setIsFirstFetch(false);
        setIsDataLoading(false);
      }
    };
    const isFromEdit2 = location.state?.from === "edit2Page";

    if (userInfo?.userId && !isFromEdit2) {
      fetchData();
    }
  }, [userInfo, location.state]);

  const handleTransactionSelect = (transaction: AutoBrewingTransaction) => {
    setSelectedTransaction(transaction);
    navigate(`/edit1/${transaction.transactionId}`);
  };

  const handleSignInClick = () => {
    webViewActions.navigate("Signin");
  };

  const handleShare = (song: Song) => {
    openModal(
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold mb-2 text-white">
          곡 버전 선택을 다시 하고 싶으신가요?
        </h2>
        <p className="text-sm text-neutral-300 mb-4">
          카톡 채널로 문의 주시면 24시간 내에 수정 해서 전달 드립니다.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              webViewActions.openUrl(
                "http://pf.kakao.com/_ztcLG/chat?mode=chat&input=%EC%8B%A0%EC%B2%AD%EA%B3%A1%20%EB%B2%84%EC%A0%84%EC%9D%84%20%EC%88%98%EC%A0%95%ED%95%98%EA%B3%A0%20%EC%8B%B6%EC%96%B4%EC%9A%94"
              );
              closeModal();
            }}
            className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-colors"
          >
            네
          </button>
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors"
          >
            아니오
          </button>
        </div>
      </div>
    );
  };

  const handleSongPress = (song: Song) => {
    webViewActions.pressSong(song);
  };

  const handleNavigateToMake = () => {
    webViewActions.navigate("Make");
  };

  const handleRequestPress = (request: SongRequest) => {
    const matchingTransaction = autoBrewingTransactions.find(
      (t) => t.songRequestId === request.songRequestId && t.status === "pending"
    );

    if (matchingTransaction) {
      handleTransactionSelect(matchingTransaction);
    } else {
      openModal(<SongRequestModalContent request={request} />);
    }
  };

  if (!userInfo?.userId) {
    return (
      <div className="min-h-screen bg-black p-5 flex flex-col items-center justify-center text-white">
        <p className="text-lg mb-4">로그인 후에 제조가 가능해요!</p>
        <button
          onClick={handleSignInClick}
          className="px-6 py-3 bg-yellow-400 text-black rounded-lg font-medium hover:bg-yellow-500 transition-colors"
        >
          로그인하기
        </button>
      </div>
    );
  }

  if (
    !isDataLoading &&
    completedSongs.length === 0 &&
    failedPendingOrErrorRequests.length === 0
  ) {
    return (
      <div className="min-h-screen bg-black p-5 flex flex-col items-center justify-center text-white">
        <div className="flex flex-col items-center">
          <p className="text-lg mb-4">아직 제작한 노래가 없어요!</p>
          <button
            onClick={handleNavigateToMake}
            className="px-6 py-3 bg-yellow-400 text-black rounded-lg font-medium hover:bg-yellow-500 transition-colors"
          >
            노래 만들러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20 text-white">
      <div className="max-w-[500px] mx-auto px-5">
        <div className="mt-8 mb-12">
          <h1 className="text-2xl font-semibold">
            {userInfo?.userName || "나만"}의 음악 공간
          </h1>
        </div>

        <div className="space-y-4">
          {isDataLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <SongItemSkeleton key={`song-skeleton-${i}`} />
              ))}
              {[1, 2].map((i) => (
                <RequestItemSkeleton key={`request-skeleton-${i}`} />
              ))}
            </>
          ) : (
            <>
              {completedSongs.map((song) => (
                <div
                  key={song.songId}
                  onClick={() => handleSongPress(song)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <SongImage
                      thumbnailUrl={song.thumbnailUrl}
                      artwork={song.artwork}
                      title={song.title}
                    />

                    <div className="flex-1 min-w-0 ml-3">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="text-[15px] leading-[1.3] font-medium text-white truncate">
                          {song.title}
                        </h3>
                        {song.isAI && (
                          <span className="shrink-0 px-1 py-0.5 bg-neutral-700 text-neutral-300 text-[11px] rounded">
                            AI
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-neutral-400">
                        {song.artistName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(song);
                    }}
                    className="shrink-0 p-2 rounded-full hover:bg-neutral-800"
                  >
                    <svg
                      className="w-6 h-6 text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                </div>
              ))}

              {failedPendingOrErrorRequests.map((request) => {
                const matchingTransaction = autoBrewingTransactions.find(
                  (t) =>
                    t.songRequestId === request.songRequestId &&
                    t.status === "pending"
                );
                const isClickable = matchingTransaction;

                return (
                  <div
                    key={request.songRequestId}
                    onClick={() =>
                      matchingTransaction
                        ? handleTransactionSelect(matchingTransaction)
                        : handleRequestPress(request)
                    }
                    className={`
                      flex items-center gap-3 bg-neutral-900 p-3 rounded-lg
                      ${
                        isClickable
                          ? "cursor-pointer border border-neutral-700 hover:bg-neutral-800 active:scale-[0.99] transition-all hover:shadow-md"
                          : "cursor-default border border-transparent"
                      }
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="text-[15px] leading-[1.3] font-medium text-white truncate">
                          {request.songTitle}
                        </h3>
                      </div>
                      <p className="text-[13px] text-neutral-400">
                        {request.artistName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-neutral-400">
                        {new Date(
                          request.requestAt.seconds * 1000
                        ).toLocaleDateString()}
                      </span>
                      <div
                        className={`px-2 py-1 rounded-md text-xs font-medium ${
                          matchingTransaction
                            ? "bg-green-400/10 text-green-400"
                            : request.status === Status.PENDING
                            ? "bg-yellow-400/10 text-yellow-400"
                            : "bg-red-400/10 text-red-400"
                        }`}
                      >
                        {matchingTransaction
                          ? "클릭!"
                          : request.status === Status.PENDING
                          ? "대기"
                          : "실패"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestPage;
