import { atom } from "recoil";
import { AutoBrewingTransaction, User } from "./types/schema";

export const userState = atom<User | null>({
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
