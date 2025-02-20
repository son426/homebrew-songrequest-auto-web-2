import { atom } from "recoil";
import { AutoBrewingTransaction, Song, SongRequest } from "./types/schema";

export const userState = atom<any | null>({
  key: "userState",
  default: null,
});

export const selectedTransactionState = atom<AutoBrewingTransaction | null>({
  key: "selectedTransactionState",
  default: null,
});

type SongMeta = {
  audioUrl: string | null;
  artwork: string | null;
};

export const selectedSongMetaState = atom<SongMeta | null>({
  key: "selectedSongMetaState",
  default: null,
});

export const completedSongsState = atom<Song[]>({
  key: "completedSongsState",
  default: [],
});

export const pendingRequestsState = atom<SongRequest[]>({
  key: "pendingRequestsState",
  default: [],
});

export const autoBrewingTransactionsState = atom<AutoBrewingTransaction[]>({
  key: "autoBrewingTransactionsState",
  default: [],
});

export const isFirstFetchState = atom({
  key: "isFirstFetchState",
  default: true,
});
