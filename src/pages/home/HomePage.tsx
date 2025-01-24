import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Song,
  SongRequest,
  Status,
  AutoBrewingTransaction,
} from "../../types/schema";
import { useRecoilState } from "recoil";
import { selectedTransactionState, userState } from "../../atom";
import SongRequestModalContent from "./components/SongRequestModalContent";

import {
  setupWebViewMessageListener,
  webViewActions,
} from "../../services/webView.service";
import { FirestoreService } from "../../services/firestore.service";
import { useModal } from "../../components/modal/useModal";

const DUMMY_USER_ID = "";
const WEBVIEW_USER_TIMEOUT_MS = 3000;

const HomePage: React.FC = () => {
  const [completedSongs, setCompletedSongs] = useState<Song[]>([]);
  const [failedPendingOrErrorRequests, setFailedPendingOrErrorRequests] =
    useState<SongRequest[]>([]);
  const [userInfo, setUserInfo] = useRecoilState(userState);

  console.log("테스트!!!");

  const [autoBrewingTransactions, setAutoBrewingTransactions] = useState<
    AutoBrewingTransaction[]
  >([]);
  const [selectedTransaction, setSelectedTransaction] = useRecoilState(
    selectedTransactionState
  );

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const navigate = useNavigate();
  const { openModal } = useModal();

  // 웹뷰 리스너
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (window.USER_INFO) {
      setUserInfo(window.USER_INFO);
      setIsInitialLoading(false);
    } else {
      timeoutId = setTimeout(() => {
        setIsInitialLoading(false);
      }, WEBVIEW_USER_TIMEOUT_MS);
    }

    // 웹뷰 메시지 리스너 설정
    const cleanup = setupWebViewMessageListener((newUserInfo) => {
      setUserInfo(newUserInfo);
      setIsInitialLoading(false);
      if (timeoutId) clearTimeout(timeoutId);
    });

    window.updateUserState = setUserInfo;
    return () => {
      cleanup();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // 데이터 fetch
  useEffect(() => {
    const fetchData = async () => {
      setIsDataLoading(true);
      const userId = userInfo?.userId || DUMMY_USER_ID;
      if (!userId) return;
      try {
        const [songRequestsData, brewingTransactions] = await Promise.all([
          FirestoreService.getSongRequests(userId),
          FirestoreService.getBrewingTransactions(
            userInfo?.userId || DUMMY_USER_ID
          ),
        ]);

        setAutoBrewingTransactions(brewingTransactions);
        setFailedPendingOrErrorRequests(songRequestsData.pendingRequests);

        const completedSongs = await FirestoreService.getCompletedSongs(
          songRequestsData.completedSongIds
        );
        setCompletedSongs(completedSongs);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, [userInfo, isInitialLoading]);

  const handleTransactionSelect = (transaction: AutoBrewingTransaction) => {
    setSelectedTransaction(transaction);
    navigate(`/edit1/${transaction.transactionId}`);
  };

  const handleSignInClick = () => {
    webViewActions.navigate("Signin");
  };

  const handleShare = (song: Song) => {
    webViewActions.shareSong(song);
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

  if (isInitialLoading || isDataLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-black p-5 pb-20 text-white">
      <div className="mb-8">
        <h1 className="text-lg mb-0.5">나만의 노래 보관함</h1>
        <p className="text-sm text-neutral-400">직접 노래를 만들어보세요!</p>
      </div>

      <div className="space-y-4">
        {completedSongs.map((song) => (
          <div
            key={song.songId}
            onClick={() => handleSongPress(song)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex items-center flex-1 min-w-0">
              <div
                className="w-[100px] h-[56px] rounded overflow-hidden shrink-0"
                style={{
                  backgroundImage: `url(${song.thumbnailUrl || song.artwork})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
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
                className="w-5 h-5 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
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

          return (
            <div
              key={request.songRequestId}
              onClick={() =>
                matchingTransaction
                  ? handleTransactionSelect(matchingTransaction)
                  : handleRequestPress(request)
              }
              className="flex items-center gap-3 cursor-pointer group bg-neutral-900 p-3 rounded-lg hover:bg-neutral-800 active:scale-[0.99] transition-all"
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
                    ? "제작가능"
                    : request.status === Status.PENDING
                    ? "대기"
                    : "실패"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HomePage;
