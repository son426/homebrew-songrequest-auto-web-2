import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  runTransaction,
  updateDoc,
  limit,
  serverTimestamp,
  setDoc,
  documentId,
} from "firebase/firestore";
import {
  Collections,
  Song,
  SongRequest,
  Status,
  AutoBrewingTransaction,
  User,
  Artist,
} from "../types/schema";
import { generateSearchKeywordList } from "./string.service";
import { urlFooter, urlHeader } from "../constants";

export class FirestoreService {
  private static db = getFirestore();

  static async getSongRequests(userId: string): Promise<{
    completedSongIds: string[];
    pendingRequests: SongRequest[];
  }> {
    const songRequestsRef = collection(this.db, Collections.SONG_REQUEST);
    const q = query(
      songRequestsRef,
      where("userId", "==", userId),
      orderBy("requestAt", "desc")
    );

    const snapshot = await getDocs(q);
    const completedSongIds: string[] = [];
    const pendingRequests: SongRequest[] = [];

    snapshot.forEach((doc) => {
      const request = {
        ...doc.data(),
        songRequestId: doc.id,
      } as SongRequest;

      if ([Status.COMPLETE, Status.EXISTING].includes(request.status)) {
        if (request.songId && request.songId.trim() !== "") {
          completedSongIds.push(request.songId);
        }
      } else {
        pendingRequests.push(request);
      }
    });

    return { completedSongIds, pendingRequests };
  }

  static async getBrewingTransactions(
    userId: string
  ): Promise<AutoBrewingTransaction[]> {
    const brewingRef = collection(
      this.db,
      Collections.AUTO_BREWING_TRANSACTION
    );
    const q = query(
      brewingRef,
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      transactionId: doc.id,
    })) as AutoBrewingTransaction[];
  }

  static async fetchUser(userId: string): Promise<User[]> {
    const userRef = collection(this.db, Collections.USER);
    const q = query(userRef, where("userId", "==", userId));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      userId: doc.id,
    })) as User[];
  }

  static async getCompletedSongs(songIds: string[]): Promise<Song[]> {
    if (songIds.length === 0) return [];

    const chunks = this.chunkArray(songIds, 10);
    const songsRef = collection(this.db, Collections.SONG);
    const songsPromises = chunks.map(async (chunk) => {
      const q = query(songsRef, where(documentId(), "in", chunk));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => doc.data() as Song);
    });

    const songsArrays = await Promise.all(songsPromises);
    return songsArrays.flat();
  }

  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  static async updateSongRequestToComplete({
    songRequestId,
    userId,
    newSongId,
  }: {
    songRequestId: string;
    userId: string;
    newSongId: string;
  }): Promise<void> {
    const songRequestRef = doc(
      this.db,
      Collections.SONG_REQUEST,
      songRequestId
    );
    const userRef = doc(this.db, Collections.USER, userId);

    try {
      await runTransaction(this.db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error(`User document with ID ${userId} does not exist`);
        }

        const userData = userDoc.data() as User;

        transaction.update(songRequestRef, {
          status: Status.COMPLETE,
          songId: newSongId,
        });

        const updatedSongRequestList = userData.songRequestList.map(
          (request) => {
            if (request.songRequestId === songRequestId) {
              return { ...request, status: Status.COMPLETE, songId: newSongId };
            }
            return request;
          }
        );

        // const updatedCredit = userData.credit
        //   ? {
        //       ...userData.credit,
        //       balance:
        //         userData.credit.balance > 0
        //           ? userData.credit.balance - 1
        //           : userData.credit.balance,
        //     }
        //   : undefined;

        transaction.update(userRef, {
          songRequestList: updatedSongRequestList,
          // ...(updatedCredit && { credit: updatedCredit }),
        });
      });

      console.log(
        `Successfully updated song request and user credit for user ${userId}`
      );
    } catch (error) {
      console.error("Error in updateSongRequestWithCredit: ", error);
      throw error;
    }
  }

  static async updateBrewingTransactionStatus(
    transactionId: string,
    songId: string,
    status: "completed" | "failed",
    error?: string
  ): Promise<void> {
    const transactionRef = doc(
      this.db,
      Collections.AUTO_BREWING_TRANSACTION,
      transactionId
    );

    try {
      await updateDoc(transactionRef, {
        status,
        songId,
        ...(error && { error }),
      });
      console.log(
        `Successfully updated brewing transaction status to ${status}`
      );
    } catch (error) {
      console.error("Error updating brewing transaction status:", error);
      throw error;
    }
  }

  private static async generateSongId(): Promise<string> {
    const songCollectionRef = collection(this.db, Collections.SONG);
    const songQuery = query(
      songCollectionRef,
      orderBy("songId", "desc"),
      limit(1)
    );
    const songSnapshot = await getDocs(songQuery);

    let newId = "00000";

    if (!songSnapshot.empty) {
      const lastDoc = songSnapshot.docs[0];
      const lastId = lastDoc.data().songId as string;
      const lastIdNumber = parseInt(lastId, 10);
      const newIdNumber = lastIdNumber + 1;
      newId = newIdNumber.toString().padStart(5, "0");
    }

    return newId;
  }

  static async addNewSong({
    artistId,
    artistName,
    title,
    thumbnailUrl,
    youtubeId,
    tagList,
    isAI,
    makerUserId,
    tag,
    url,
  }: {
    artistId: string;
    artistName: string;
    title: string;
    thumbnailUrl: string;
    youtubeId: string;
    tagList: string[];
    isAI: boolean;
    makerUserId: string;
    tag: { genreList: string[]; [key: string]: any };
    url?: string;
  }): Promise<Song> {
    const songCollectionRef = collection(this.db, Collections.SONG);
    const artistDocRef = doc(this.db, Collections.ARTIST, artistId);

    try {
      const newSongId = await this.generateSongId();
      console.log("addNewSong songId : ", newSongId);

      const finalThumbnailUrl = thumbnailUrl
        ? thumbnailUrl
        : `https://firebasestorage.googleapis.com/v0/b/homebrew-prod.appspot.com/o/artwork%2F${newSongId}.jpg?alt=media`;

      const searchKeywordList = generateSearchKeywordList(title);

      const newSong: Song = {
        songId: newSongId,
        artistIdList: [artistId],
        artist: artistName,
        artistName: artistName,
        title,
        thumbnailUrl: finalThumbnailUrl,
        artwork: finalThumbnailUrl,
        url: url || `${urlHeader}${newSongId}${urlFooter}`,
        youtubeId,
        viewCount: 0,
        chartRank: 0,
        likeUserIdList: [],
        isAI,
        makerUserId,
        madeAt: serverTimestamp(),
        tag: {
          genreList: tag.genreList,
          tagList: tagList,
        },
        lyricistNameList: [],
        composerNameList: [],
        arrangerNameList: [],
        isKomcaManaged: true,
        viewCount30sec: 0,
        viewCount50sec: 0,
        viewCount60sec: 0,
        viewCount90sec: 0,
        tagList,
        originalSongId: "",
        isOriginalSong: false,
        searchKeywordList,
        songMeta: {
          audioUrl: "",
        },
      };

      const songDocRef = doc(this.db, Collections.SONG, newSongId);
      await setDoc(songDocRef, newSong);

      const artistDocSnap = await getDoc(artistDocRef);
      if (artistDocSnap.exists()) {
        const artistData = artistDocSnap.data() as Artist;
        const updatedSongIdList = [...artistData.songIdList, newSongId];
        await updateDoc(artistDocRef, {
          songIdList: updatedSongIdList,
        });

        return newSong;
      } else {
        throw new Error("Artist document does not exist");
      }
    } catch (error) {
      console.error("Error adding new song: ", error);
      throw error;
    }
  }
}
