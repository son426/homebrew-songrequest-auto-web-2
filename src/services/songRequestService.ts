import { doc, runTransaction, updateDoc } from "firebase/firestore";
import { Collections, Status, User } from "../types/schema";
import { db } from "../lib/firebase";

// 통합된 업데이트 함수
export const updateSongRequestToComplete = async ({
  songRequestId,
  userId,
  newSongId,
}: {
  songRequestId: string;
  userId: string;
  newSongId: string;
}): Promise<void> => {
  const songRequestRef = doc(db, Collections.SONG_REQUEST, songRequestId);
  const userRef = doc(db, Collections.USER, userId);

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Get user document
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error(`User document with ID ${userId} does not exist`);
      }

      const userData = userDoc.data() as User;

      // 2. Update song request status
      transaction.update(songRequestRef, {
        status: Status.COMPLETE,
        songId: newSongId,
      });

      // 3. Update user's song request list
      const updatedSongRequestList = userData.songRequestList.map((request) => {
        if (request.songRequestId === songRequestId) {
          return { ...request, status: Status.COMPLETE, songId: newSongId };
        }
        return request;
      });

      // 4. Update credit balance if applicable
      const updatedCredit = userData.credit
        ? {
            ...userData.credit,
            balance:
              userData.credit.balance > 0
                ? userData.credit.balance - 1
                : userData.credit.balance,
          }
        : undefined;

      // 4. Apply all updates in a single transaction
      transaction.update(userRef, {
        songRequestList: updatedSongRequestList,
        ...(updatedCredit && { credit: updatedCredit }),
      });
    });

    console.log(
      `Successfully updated song request and user credit for user ${userId}`
    );
  } catch (error) {
    console.error("Error in updateSongRequestWithCredit: ", error);
    throw error;
  }
};

export const updateBrewingTransactionStatus = async (
  transactionId: string,
  songId: string,
  status: "completed" | "failed",
  error?: string
) => {
  const transactionRef = doc(
    db,
    Collections.AUTO_BREWING_TRANSACTION,
    transactionId
  );

  try {
    await updateDoc(transactionRef, {
      status,
      songId,
      ...(error && { error }),
    });
    console.log(`Successfully updated brewing transaction status to ${status}`);
  } catch (error) {
    console.error("Error updating brewing transaction status:", error);
    throw error;
  }
};
