// collection
export type Song = {
  songId: string;
  artist: string;
  artistIdList: string[];
  url: string;
  title: string;
  artistName: string; // 추후 데이터 삭제해야함. 번들 업데이트 유저가 다 됐을 시점에.
  thumbnailUrl: string; // 추후 데이터 삭제해야함. 번들 업데이트 유저가 다 됐을 시점에.
  artwork: string;
  youtubeId: string;
  viewCount: number;
  viewCount30sec: number;
  viewCount50sec: number;
  viewCount60sec: number;
  viewCount90sec: number;
  chartRank: number;
  likeUserIdList: string[];
  tagList: string[];
  searchKeywordList: string[];
  lyricistNameList: string[];
  composerNameList: string[];
  arrangerNameList: string[];
  isKomcaManaged: boolean;
  tag: {
    genreList: string[];
    tagList: string[];
    [key: string]: any;
  };
  isAI: boolean;
  makerUserId: string;
  madeAt: any;
  originalSongId: string; // 새롭게 추가
  isOriginalSong: boolean; // 새롭게 추가
};

export type OriginalSong = {
  id: string;
  title: string;
  artist: Artist | null;
  artistId: string | null;
  artistName: string;
  songIdList: string[];
  coverArtistIdList: string[]; // 대비용
  madeAt: any;
};

export type Track = {
  id: string;
  url: string;
  title: string;
  artist: string;
  artwork: string;
  isAI: boolean;
  viewCount: number;
};

export type Short = {
  shortId: string;
  artistName: string;
  artistIdList: string[];
  title: string;
  thumbnailUrl: string;
  youtubeId: string;
  viewCount: number;
  viewCount30sec: number;
  chartRank: number;
  likeUserIdList: string[];
  isAI: boolean;
  makerUserId: string;
  madeAt: any;
  originalSongId: string;
  tag: {
    genreList: string[];
    themeList: string[];
    tagList: string[];
    [key: string]: any;
  };
};

export type Artist = {
  artistId: string;
  artistName: string;
  artistImageUrl: string;
  searchKeywordList: string[];
  artistDetailImageUrl: string;
  chartRank: 0;
  followerIdList: string[];
  songIdList: string[];
  tagList: string[];
  tag: {
    genreList: string[];
    tagList: string[];
    [key: string]: any;
  };
  isMale: boolean;
  modelName: string | null;
};

export type Playlist = {
  playlistId: string;
  playlistName: string;
  playlistImageUrl: string;
  songList: Song[];
};

export type HomebrewPlaylist = {
  playlistId: string;
  artistIdList: string[];
  artistName: string;
  title: string;
  subTitle: string;
  imageUrl: string;
  songList: Song[];
  tag: {
    genreList: string[];
    tagList: string[];
    [key: string]: any;
  };
};

export interface User {
  userId: string;
  userName: string;
  email: string;
  searchKeywordList: string[];
  likeSongList: Song[];
  followArtistList: Artist[];
  songRequestList: SongRequest[];
  playlistList: Playlist[];
  fcmToken: string;
  tag: {
    genreList: string[];
    dislikeSongIdList: string[];
    [key: string]: any;
  };
  credit: {
    balance: number;
    referralCode: string; // 유저의 고유 추천 코드
  };
  notificationList: UserNotification[];
  recentSongIdList?: string[];
}

export type UserNotification = {
  id: string;
  songId: string;
  type: "NEW_SONG" | "SONG_UPDATE";
  isRead: boolean;
  createdAt: any;
};

export interface CreditTransaction {
  id: string;
  userId?: string;
  deviceId: string;
  amount: number;
  type: CreditTransactionType; // 대분류
  action: CreditActionType; // 소분류
  status: CreditTransactionStatus;
  metadata: {
    referralCode?: string;
    referrerUserId?: string;
    shareTarget?: string;
    shareCount?: number;
    contentId?: string;
    contentType?: string;
    platform?: string;
    appVersion?: string;
    [key: string]: any;
  };
  createdAt: any;
  updatedAt: any;
}

export interface SongRequest {
  songRequestId: string;
  songId: string;
  songTitle: string;
  artistName: string;
  existingArtist: Artist | null; // 추가
  status: Status;
  userId: string;
  deviceId: string;
  hashedDeviceId: string;
  userName: string;
  userEmail: string;
  userToken: string;
  otherUserList: {
    userId: string;
    userName: string;
    userEmail: string;
    userToken: string;
  }[]; // 추가
  requestAt: any;
  songRequestGroupId?: string;
  index: number;
}

export interface Token {
  fcmToken: string;
  userName: string;
  email: string;
  platform: string;
  recentlyUseAt: any;
}

export interface Device {
  deviceId: string;
  hashedDeviceId: string;
  fcmToken: string;
  userName: string;
  userId: string;
  email: string;
  platform: string;
  tag: {
    genreList: string[];
    dislikeSongIdList: string[];
    [key: string]: any;
  };
  recentlyUseAt: any;
}

export interface Update {
  id: string;
  updateDate: any;
  allUpdateDate: any;
  updateDocumentId: string;
}

export interface ISongLog {
  songId: string;
  logAt: any;
}
export interface ISearchLog {
  searchWord: string;
  logAt: any;
}

export interface DeviceLog {
  deviceId: string;
  likeSongList: ISongLog[];
  playStartList: ISongLog[];
  play30secList: ISongLog[];
  play60secList: ISongLog[];
  play90secList: ISongLog[];
  playCompleteList: ISongLog[];
  searchQueryList: ISearchLog[];
}

export type Guide = {
  id: string;
  guideTitle: string;
  isMale: boolean;
  driveId: string;
  searchKeywordList: string[];
};

export enum Collections {
  USER = "User",
  SONG = "Song",
  SHORT = "Short",
  ARTIST = "Artist",
  SONG_REQUEST = "SongRequest",
  DEVICE = "Device",
  HOMEBREW_PLAYLIST = "HomebrewPlaylist",
  TESTER = "Tester",
  TOKEN = "Token",
  DEVICE_LOG = "DeviceLog",
  STAGING_TOKEN = "StagingToken",
  DEBUG_TOKEN = "DebugToken",
  UPDATE = "Update",
  CREDIT_TRANSACTION = "CreditTransaction",
  BREWING_TRANSACTION = "BrewingTransaction",
  PENDING_BREWING_TRANSACTION = "PendingBrewingTransaction",
  GUIDE = "Guide",
  ORIGINAL_SONG = "OriginalSong",
}

export enum Genre {
  BALLAD = "ballad",
  INDIE = "indie",
  ROCK = "rock",
  BLUES = "blues",
  JAZZ = "jazz",
  RNB = "rnb",
  FOLK = "folk",
  POP = "pop",
  KPOP = "kpop",
  JPOP = "jpop",
  DANCE = "dance",
  HIPHOP = "hiphop",
  OST = "ost",
}

export enum Status {
  PENDING = "pending",
  EXISTING = "existing",
  COMPLETE = "completed",
  FAILED = "failed",
  ERROR = "error",
}

export enum LogField {
  LIKE_SONG = "likeSongList",
  PLAY_START = "playStartList",
  PLAY_30SEC = "play30secList",
  PLAY_50SEC = "play50secList",
  PLAY_60SEC = "play60secList",
  PLAY_90SEC = "play90secList",
  PLAY_COMPLETE = "playCompleteList",
  SEARCH_QUERY = "searchQueryList",
}

export enum SongListFetchType {
  CHART = "CHART",
  // 필요한 다른 타입들 추가
}

export enum CreditTransactionType {
  EARN = "earn", // 크레딧 획득
  SPEND = "spend", // 크레딧 사용
  SYSTEM = "system", // 시스템 작업 (조정, 만료 등)
}

export enum CreditActionType {
  // 획득 액션
  REFERRAL_CODE_USE = "REFERRAL_CODE_USE", // 추천코드 사용
  REFERRAL_SIGNUP = "REFERRAL_SIGNUP", // 추천인 가입 완료
  SHARE_MILESTONE = "SHARE_MILESTONE", // 공유 마일스톤
  DAILY_LOGIN = "DAILY_LOGIN", // 일일 로그인
  LISTEN_COMPLETE = "LISTEN_COMPLETE", // 곡 완청
  PURCHASE = "PURCHASE", // 곡 완청
  WATCH_AD = "WATCH_AD", // 광고 시청

  // 사용 액션
  SONG_REQUEST = "song_request", // 곡 요청
  CREATE_PLAYLIST = "create_playlist", // 플레이리스트 생성

  // 시스템 액션
  SYSTEM_ADJUST = "system_adjust", // 시스템 조정
  EXPIRE = "expire", // 만료
  REFUND = "refund", // 환불/취소
}

export enum CreditTransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export type AudioPair = {
  mrUrl: string;
  vocalUrl: string;
};

export type BrewingTransaction = {
  transactionId: string;
  timestamp: any;
  type: string;
  songRequestId: string;
  songId: string;
  songTitle: string;
  artistName: string;
  existingArtist: Artist | null;
  audioPairList: AudioPair[];
  status: "completed" | "failed" | "pending";
  error?: string;
  targetUserInfoList: {
    // 알림을 보내야 할 유저 정보
    userId: string;
    userToken?: string; // FCM 토큰
  }[];
  updatedUserIdList: string[];
  notificationsSent: {
    userId: string;
    status: "completed" | "failed";
    error?: string;
  }[];
};

export type PendingBrewingTransaction = {
  id: string;
  songRequestId: string;
  existingArtist: Artist | null;
  status: "completed" | "failed" | "pending";
  error?: string;
  userId: string;
  userName: string;
  userToken: string;
  model: string;
  isMaleSinger: boolean;
  guideTitle: string;
  guideId: string;
  requestAt: any;
  [key: string]: any;
};
