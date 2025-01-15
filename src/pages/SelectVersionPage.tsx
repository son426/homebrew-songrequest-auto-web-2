import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import MinusIcon from "../assets/pitchminus.svg";
import PlusIcon from "../assets/pitchplus.svg";
import { useSetRecoilState } from "recoil";
import { selectedSongState } from "../atom";
import { useNavigate } from "react-router-dom";

interface AudioPair {
  mrUrl: string;
  vocalUrl: string;
  resultUrl: string;
}

interface InferenceData {
  songRequestId: string;
  songTitle: string;
  guideId: string;
  voiceModel: string;
  isMan: boolean;
  requestAt: string;
  requestUserId: string;
  audioPairList: AudioPair[];
}

interface VersionGroup {
  version: string;
  pitchGroups: {
    pitch: string;
    audioPair: AudioPair;
  }[];
}

interface PlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}

const SelectVersionPage: React.FC = () => {
  const [inferenceData, setInferenceData] = useState<InferenceData | null>(
    null
  );
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [versionGroups, setVersionGroups] = useState<VersionGroup[]>([]);
  const [playerStates, setPlayerStates] = useState<PlayerState[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentPitchIndex, setCurrentPitchIndex] = useState<number>(0);
  const [selectedFinal, setSelectedFinal] = useState<boolean>(false);
  const setSelectedSong = useSetRecoilState(selectedSongState);
  const navigate = useNavigate();

  useEffect(() => {
    const mockData: InferenceData = {
      songRequestId: "mock-123",
      songTitle: "테스트 곡",
      guideId: "guide-123",
      voiceModel: "model-1",
      isMan: true,
      requestAt: "2024-03-20T12:00:00Z",
      requestUserId: "user-123",
      audioPairList: [
        {
          mrUrl:
            "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_mr.mp3",
          vocalUrl:
            "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_reverb.mp3",
          resultUrl:
            "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[-1]1_result.mp3",
        },
        {
          mrUrl:
            "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_mr.mp3",
          vocalUrl:
            "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_reverb.mp3",
          resultUrl:
            "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[-1]2_result.mp3",
        },
        {
          mrUrl:
            "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_mr.mp3",
          vocalUrl:
            "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_reverb.mp3",
          resultUrl:
            "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0]1_result.mp3",
        },
        {
          mrUrl:
            "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_mr.mp3",
          vocalUrl:
            "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_reverb.mp3",
          resultUrl:
            "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0]2_result.mp3",
        },
        {
          mrUrl:
            "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_mr.mp3",
          vocalUrl:
            "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_reverb.mp3",
          resultUrl:
            "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[1]1_result.mp3",
        },
        {
          mrUrl:
            "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_mr.mp3",
          vocalUrl:
            "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_reverb.mp3",
          resultUrl:
            "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[1]2_result.mp3",
        },
      ],
    };

    setInferenceData(mockData);

    const groupByVersion = (audioPairs: AudioPair[]): VersionGroup[] => {
      const groups: {
        [key: string]: { pitch: string; audioPair: AudioPair }[];
      } = {};

      audioPairs.forEach((pair) => {
        const match = pair.resultUrl.match(/\[([^\]]+)\](\d+)_result\.mp3$/);
        if (match) {
          const [, pitch, version] = match;
          if (!groups[version]) {
            groups[version] = [];
          }
          groups[version].push({ pitch, audioPair: pair });
        }
      });

      return Object.entries(groups)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([version, pitchGroups]) => ({
          version,
          pitchGroups: pitchGroups.sort(
            (a, b) => Number(a.pitch) - Number(b.pitch)
          ),
        }));
    };

    if (mockData.audioPairList) {
      setVersionGroups(groupByVersion(mockData.audioPairList));
    }
  }, []);

  useEffect(() => {
    if (versionGroups.length > 0) {
      setPlayerStates(
        versionGroups.map(() => ({
          currentTime: 0,
          duration: 0,
          isPlaying: false,
        }))
      );
    }
  }, [versionGroups]);

  const handlePlayPause = async (version: string, index: number) => {
    if (audioRef.current) {
      try {
        if (selectedVersion !== index) {
          if (selectedVersion !== null) {
            const currentStates = [...playerStates];
            currentStates[selectedVersion] = {
              ...currentStates[selectedVersion],
              isPlaying: false,
            };
            setPlayerStates(currentStates);
          }

          setSelectedVersion(index);
          const firstAudioPair = versionGroups[index].pitchGroups[0].audioPair;
          audioRef.current.src = firstAudioPair.resultUrl;
          audioRef.current.load();
          audioRef.current.currentTime = playerStates[index].currentTime;
        }

        const newPlayerStates = playerStates.map((state, i) => ({
          ...state,
          isPlaying: i === index ? !state.isPlaying : false,
        }));
        setPlayerStates(newPlayerStates);

        if (playerStates[index].isPlaying) {
          await audioRef.current.pause();
        } else {
          await audioRef.current.play();
        }
      } catch (error) {
        console.log("Audio playback error:", error);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && selectedVersion !== null) {
      const newPlayerStates = [...playerStates];
      newPlayerStates[selectedVersion] = {
        ...newPlayerStates[selectedVersion],
        currentTime: audioRef.current.currentTime,
      };
      setPlayerStates(newPlayerStates);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && selectedVersion !== null) {
      const newPlayerStates = [...playerStates];
      newPlayerStates[selectedVersion] = {
        ...newPlayerStates[selectedVersion],
        duration: audioRef.current.duration,
      };
      setPlayerStates(newPlayerStates);
    }
  };

  const handleProgressChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const time = Number(e.target.value);
    if (audioRef.current && selectedVersion === index) {
      audioRef.current.currentTime = time;
      const newPlayerStates = [...playerStates];
      newPlayerStates[index] = {
        ...newPlayerStates[index],
        currentTime: time,
      };
      setPlayerStates(newPlayerStates);
    }
  };

  const handlePitchChange = (index: number, direction: "up" | "down") => {
    if (!versionGroups[index]) return;

    const pitchGroups = versionGroups[index].pitchGroups;
    let newPitchIndex = currentPitchIndex;

    if (direction === "up" && currentPitchIndex < pitchGroups.length - 1) {
      newPitchIndex = currentPitchIndex + 1;
    } else if (direction === "down" && currentPitchIndex > 0) {
      newPitchIndex = currentPitchIndex - 1;
    }

    if (newPitchIndex !== currentPitchIndex) {
      setCurrentPitchIndex(newPitchIndex);

      if (audioRef.current) {
        const newAudioPair = pitchGroups[newPitchIndex].audioPair;
        audioRef.current.src = newAudioPair.resultUrl;
        audioRef.current.load();

        if (playerStates[index]?.isPlaying) {
          audioRef.current.play();
        }
      }
    }
  };

  const handleSelectComplete = () => {
    if (selectedVersion !== null && inferenceData) {
      const selectedAudioPair =
        versionGroups[selectedVersion].pitchGroups[currentPitchIndex].audioPair;

      const selectedData = {
        songRequestId: inferenceData.songRequestId,
        songTitle: inferenceData.songTitle,
        guideId: inferenceData.guideId,
        voiceModel: inferenceData.voiceModel,
        isMan: inferenceData.isMan,
        requestAt: inferenceData.requestAt,
        requestUserId: inferenceData.requestUserId,
        resultAudioUrl: selectedAudioPair.resultUrl,
      };

      setSelectedSong(selectedData);
      setSelectedFinal(true);
      navigate("/select-album-cover");
    }
  };

  return (
    <div className="min-h-screen bg-black p-5 pb-20 text-white">
      <h1 className="mb-8 text-lg">
        가장 마음에 드는 1개 버전을 선택해주세요.
      </h1>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {versionGroups.map((group, index) => (
        <div
          key={index}
          onClick={() => handlePlayPause(group.version, index)}
          className={`relative mb-5 cursor-pointer rounded-xl p-4 transition-all duration-200 hover:bg-neutral-900 active:scale-[0.99] ${
            selectedVersion === index ? "bg-neutral-800" : "bg-black"
          }`}
        >
          {selectedVersion === index && (
            <div className="absolute right-4 top-4 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePitchChange(index, "down");
                }}
                className="flex h-6 w-6 items-center justify-center text-yellow-400 focus:outline-none active:opacity-70"
              >
                <img src={MinusIcon} alt="decrease pitch" className="w-full" />
              </button>
              <span className="min-w-[20px] text-center text-sm text-yellow-400">
                {versionGroups[index].pitchGroups[currentPitchIndex].pitch}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePitchChange(index, "up");
                }}
                className="flex h-6 w-6 items-center justify-center text-yellow-400 focus:outline-none active:opacity-70"
              >
                <img src={PlusIcon} alt="increase pitch" className="w-full" />
              </button>
            </div>
          )}

          <div className="mb-3 text-base">Ver {parseInt(group.version)}.</div>

          <div className="flex w-full items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause(group.version, index);
              }}
              className="text-2xl text-yellow-400 focus:outline-none active:opacity-70"
            >
              {playerStates[index]?.isPlaying ? "■" : "▶"}
            </button>

            <div className="flex flex-1 items-center gap-3">
              <input
                type="range"
                min="0"
                max={playerStates[index]?.duration || 0}
                value={playerStates[index]?.currentTime || 0}
                onChange={(e) => {
                  e.stopPropagation();
                  handleProgressChange(e, index);
                }}
                className="h-1 flex-1 appearance-none rounded-full bg-neutral-600 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400"
              />
              <span className="min-w-[30px] text-sm text-yellow-400">
                {Math.floor((playerStates[index]?.currentTime || 0) / 60)}:
                {String(
                  Math.floor((playerStates[index]?.currentTime || 0) % 60)
                ).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
      ))}

      <button
        disabled={selectedVersion === null}
        onClick={handleSelectComplete}
        className={`fixed bottom-5 left-5 right-5 z-50 rounded-xl py-4 text-base font-bold ${
          selectedVersion === null
            ? "cursor-not-allowed bg-neutral-600 opacity-50"
            : "cursor-pointer bg-yellow-400"
        }`}
      >
        선택 완료
      </button>
    </div>
  );
};
export default SelectVersionPage;
