import { atom } from 'recoil';

interface SelectedSongData {
  songRequestId: string;
  songTitle: string;
  guideId: string;
  voiceModel: string;
  isMan: boolean;
  requestAt: string;
  requestUserId: string;
  resultAudioUrl: string;
}

export const selectedSongState = atom<SelectedSongData | null>({
  key: 'selectedSongState',
  default: null,
});