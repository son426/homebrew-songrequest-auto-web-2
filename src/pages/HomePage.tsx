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

  const navigate = useNavigate();

  useEffect(() => {
    const getUserInfo = () => {
      if (window.USER_INFO) {
        setUserInfo(window.USER_INFO);
        console.log("Received user info:", window.USER_INFO);
      }
    };

    getUserInfo();

    window.addEventListener("message", (event) => {
      const data = event.data;
      if (data?.type === "USER_INFO") {
        setUserInfo(data.payload);
      }
    });
  }, []);

  useEffect(() => {
    const fetchBrewingTransactions = async () => {
      // if (!userInfo?.userId) return;
      try {
        const db = getFirestore();
        const brewingRef = collection(db, Collections.AUTO_BREWING_TRANSACTION);
        const q = query(
          brewingRef,
          // where("userId", "==", userInfo.userId || DUMMY_USER_ID),
          where("userId", "==", DUMMY_USER_ID),
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

  // if (!userInfo?.userId) {
  //   return (
  //     <div className="min-h-screen bg-black p-5 flex flex-col items-center justify-center text-white">
  //       <p className="text-lg mb-4">로그인 후에 제조가 가능해요!</p>
  //       <button
  //         onClick={handleSignInClick}
  //         className="px-6 py-3 bg-yellow-400 text-black rounded-lg font-medium hover:bg-yellow-500 transition-colors"
  //       >
  //         로그인하기
  //       </button>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-black p-5 pb-20 text-white">
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

      <div className="mb-8 ">
        <h1 className="text-lg mb-0.5">나만의 노래 보관함</h1>
        <p className="text-sm text-neutral-400">직접 노래를 만들어보세요!</p>
      </div>

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
            className="cursor-pointer rounded-xl bg-neutral-900 p-4 transition-all hover:bg-neutral-800 active:scale-[0.99]"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium text-yellow-400">
                {transaction.songTitle}
              </h3>
              <span className="text-sm text-neutral-400">
                {new Date(
                  transaction.timestamp.seconds * 1000
                ).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-neutral-300">{transaction.artistName}</p>
            <div className="mt-2 text-xs">
              <span
                className={`rounded-full px-2 py-1 ${
                  transaction.status === "pending"
                    ? "bg-yellow-900 text-yellow-300"
                    : "bg-red-900 text-red-300"
                }`}
              >
                {transaction.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
