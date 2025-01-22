import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  Collections,
  User,
  AutoBrewingTransaction,
  Song,
} from "../types/schema";
import { useRecoilState } from "recoil";
import { selectedTransactionState, userState } from "../atom";

const DUMMY_USER_ID = "JFTwpmzL3aeTYb0Sxh2MYrPHlPG2";

const HomePage: React.FC = () => {
  const [brewingTransactions, setBrewingTransactions] = useState<
    AutoBrewingTransaction[]
  >([]);
  const [completedSongs, setCompletedSongs] = useState<Song[]>([]);
  const [userInfo, setUserInfo] = useRecoilState(userState);
  const [selectedTransaction, setSelectedTransaction] = useRecoilState(
    selectedTransactionState
  );
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  // User Info 초기화 및 업데이트 처리
  useEffect(() => {
    // 1. 초기 userInfo 설정
    if (window.USER_INFO) {
      console.log("Initial USER_INFO:", window.USER_INFO);
      setUserInfo(window.USER_INFO);
    }

    // 2. window.updateUserState 함수 설정
    window.updateUserState = (newUserInfo: User) => {
      console.log("User state updated:", newUserInfo);
      setUserInfo(newUserInfo);
    };

    // 3. 메시지 이벤트 핸들러
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === "USER_INFO_CHECK" || data?.type === "USER_INFO") {
          const newUserInfo = data.data || data.payload;
          if (newUserInfo) {
            console.log("Received user update:", newUserInfo);
            setUserInfo(newUserInfo);
          }
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    };

    window.addEventListener("message", handleMessage);

    // Cleanup
    return () => {
      window.removeEventListener("message", handleMessage);
      delete window.updateUserState;
    };
  }, []);

  useEffect(() => {
    const fetchBrewingTransactions = async () => {
      if (!userInfo?.userId) {
        setIsLoading(false);
        return;
      }

      try {
        const db = getFirestore();
        const brewingRef = collection(db, Collections.AUTO_BREWING_TRANSACTION);
        const q = query(
          brewingRef,
          where("userId", "==", userInfo.userId),
          // where("userId", "==", DUMMY_USER_ID),
          orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);
        const transactions: AutoBrewingTransaction[] = [];
        const completedSongIds: string[] = [];

        querySnapshot.forEach((doc) => {
          const transaction = doc.data() as AutoBrewingTransaction;
          transactions.push(transaction);
          if (transaction.status === "completed") {
            completedSongIds.push(transaction.songId);
          }
        });

        // Sort non-completed transactions
        const nonCompletedTransactions = transactions.filter(
          (t) => t.status !== "completed"
        );
        const sortedTransactions = nonCompletedTransactions.sort((a, b) => {
          type StatusType = "completed" | "failed" | "pending";
          const statusOrder: Record<StatusType, number> = {
            completed: 0,
            pending: 1,
            failed: 2,
          };

          if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
          }

          return b.timestamp.seconds - a.timestamp.seconds;
        });

        setBrewingTransactions(sortedTransactions);

        // Fetch completed songs
        if (completedSongIds.length > 0) {
          const songsRef = collection(db, Collections.SONG);
          const songs: Song[] = [];

          for (const songId of completedSongIds) {
            const songDoc = await getDoc(doc(songsRef, songId));
            if (songDoc.exists()) {
              songs.push(songDoc.data() as Song);
            }
          }

          setCompletedSongs(songs);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrewingTransactions();
  }, [userInfo]);

  const handleTransactionSelect = (transaction: AutoBrewingTransaction) => {
    setSelectedTransaction(transaction);
    navigate(`/edit1/${transaction.transactionId}`);
  };

  const handleSignInClick = () => {
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({
        type: "NAVIGATION",
        screen: "Signin",
      })
    );
  };

  const handleShare = (song: Song) => {
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({
        type: "SHARE_SONG",
        song: song,
      })
    );
  };

  const handleSongPress = (song: Song) => {
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({
        type: "PRESS_SONG",
        song: song,
      })
    );
  };

  const handleNavigateToMake = () => {
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({
        type: "NAVIGATION",
        screen: "Make",
      })
    );
  };

  if (isLoading) {
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

  if (brewingTransactions.length === 0 && completedSongs.length === 0) {
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
      {/* User Info Section - Commented out for now */}
      {/* {userInfo && (
      <div className="mb-6 rounded-lg bg-neutral-800/70 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="font-medium text-yellow-400">
              {userInfo.userName}
            </h2>
            <p className="text-sm text-neutral-300">{userInfo.email}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-300">크레딧</p>
            <p className="font-medium text-yellow-400">
              {userInfo.credit.balance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    )} */}

      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-lg mb-0.5">나만의 노래 보관함</h1>
        <p className="text-sm text-neutral-400">직접 노래를 만들어보세요!</p>
      </div>

      {/* Content Section */}
      <div className="space-y-4">
        {/* Completed Songs */}
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

        {/* Pending/Failed Transactions */}
        {brewingTransactions.map((transaction) => (
          <div
            key={transaction.transactionId}
            onClick={() => handleTransactionSelect(transaction)}
            className="flex items-center gap-3 cursor-pointer group bg-neutral-900 p-3 rounded-lg hover:bg-neutral-800 active:scale-[0.99] transition-all"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="text-[15px] leading-[1.3] font-medium text-white truncate">
                  {transaction.songTitle}
                </h3>
              </div>
              <p className="text-[13px] text-neutral-400">
                {transaction.artistName}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-neutral-400">
                {new Date(
                  transaction.timestamp.seconds * 1000
                ).toLocaleDateString()}
              </span>
              <div
                className={`px-2 py-1 rounded-md text-xs font-medium ${
                  transaction.status === "pending"
                    ? "bg-yellow-400/10 text-yellow-400"
                    : "bg-red-400/10 text-red-400"
                }`}
              >
                {transaction.status === "pending" ? "대기" : "실패"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
