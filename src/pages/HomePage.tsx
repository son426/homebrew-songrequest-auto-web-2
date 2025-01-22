import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { Collections, User, AutoBrewingTransaction } from "../types/schema";
import { useRecoilState } from "recoil";
import { selectedTransactionState, userState } from "../atom";

const HomePage: React.FC = () => {
  const [brewingTransactions, setBrewingTransactions] = useState<
    AutoBrewingTransaction[]
  >([]);
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
      if (!userInfo?.userId) return;
      try {
        const db = getFirestore();
        const brewingRef = collection(db, Collections.AUTO_BREWING_TRANSACTION);
        const q = query(
          brewingRef,
          where("userId", "==", userInfo.userId),
          orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);
        const transactions: AutoBrewingTransaction[] = [];

        querySnapshot.forEach((doc) => {
          transactions.push(doc.data() as AutoBrewingTransaction);
        });

        // Sort by status (completed, pending, failed) and then by timestamp
        const sortedTransactions = transactions.sort((a, b) => {
          const statusOrder = {
            completed: 0,
            pending: 1,
            failed: 2,
          };

          if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
          }

          // If status is the same, sort by timestamp (descending)
          return b.timestamp.seconds - a.timestamp.seconds;
        });

        setBrewingTransactions(sortedTransactions);
      } catch (error) {
        console.error("Error fetching brewing transactions:", error);
      }
    };

    fetchBrewingTransactions();
  }, [userInfo]);

  const handleTransactionSelect = (transaction: AutoBrewingTransaction) => {
    setSelectedTransaction(transaction);
    navigate(`/edit1/${transaction.transactionId}`);
  };

  const handleSignInClick = () => {
    // Send message to ReactNative to navigate to Signin screen
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({
        type: "NAVIGATION",
        screen: "Signin",
      })
    );
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

  return (
    <div className="min-h-screen bg-black p-5 pb-20 text-white">
      {userInfo && (
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
      )}

      <h1 className="mb-8 text-lg">AI 커버곡 목록</h1>

      <div className="space-y-4">
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
                  transaction.status === "completed"
                    ? "bg-green-900 text-green-300"
                    : transaction.status === "failed"
                    ? "bg-red-900 text-red-300"
                    : "bg-yellow-900 text-yellow-300"
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
