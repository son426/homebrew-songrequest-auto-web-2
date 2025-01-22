import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Artist, Collections, Song } from "../types/schema";
import { db } from "../lib/firebase";
import { generateSearchKeywordList } from "./stringServices";
import { urlFooter, urlHeader } from "../constants";

interface AddSongParams {
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
}

export const addNewSong = async ({
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
}: AddSongParams): Promise<string> => {
  console.log("0");
  const songCollectionRef = collection(db, Collections.SONG);
  const artistDocRef = doc(db, Collections.ARTIST, artistId);

  try {
    // Generate new songId
    const newSongId = await generateSongId();
    console.log("addNewSong songId : ", newSongId);

    const finalThumbnailUrl = thumbnailUrl
      ? thumbnailUrl
      : `https://firebasestorage.googleapis.com/v0/b/homebrew-prod.appspot.com/o/artwork%2F${newSongId}.jpg?alt=media`;

    const searchKeywordList = generateSearchKeywordList(title);

    // Create new song data
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
    };

    // Add new song to the song collection
    const songDocRef = doc(db, Collections.SONG, newSongId);
    await setDoc(songDocRef, newSong);

    // Update artist document with new song ID
    const artistDocSnap = await getDoc(artistDocRef);
    if (artistDocSnap.exists()) {
      const artistData = artistDocSnap.data() as Artist;
      const updatedSongIdList = [...artistData.songIdList, newSongId];
      await updateDoc(artistDocRef, {
        songIdList: updatedSongIdList,
      });

      return newSongId;
    } else {
      throw new Error("Artist document does not exist");
    }
  } catch (error) {
    console.error("Error adding new song: ", error);
    throw error;
  }
};

const generateSongId = async (): Promise<string> => {
  const songCollectionRef = collection(db, Collections.SONG);
  const songQuery = query(
    songCollectionRef,
    orderBy("songId", "desc"),
    limit(1)
  ); // Order by ID in descending order
  const songSnapshot = await getDocs(songQuery);

  let newId = "00000"; // Default ID if no documents are found

  if (!songSnapshot.empty) {
    const lastDoc = songSnapshot.docs[0];
    const lastId = lastDoc.data().songId as string;

    // Increment the ID
    const lastIdNumber = parseInt(lastId, 10);
    const newIdNumber = lastIdNumber + 1;

    // Pad the new ID to ensure it has a length of 5 digits
    newId = newIdNumber.toString().padStart(5, "0");
  }

  return newId;
};
