import React, { useState, useEffect, useRef } from "react";
import MinusIcon from "../assets/pitchminus.svg";
import PlusIcon from "../assets/pitchplus.svg";
import { useSetRecoilState } from "recoil";
import { useNavigate, useParams } from "react-router-dom";
import { AutoBrewingTransaction, Collections } from "../types/schema";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { selectedSongMetaState } from "../atom";

interface VersionGroup {
  version: string;
  pitchGroups: {
    pitch: string;
    audioPair: {
      mrUrl: string;
      vocalUrl: string;
      resultUrl: string;
    };
  }[];
}

interface PlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}

const Edit1Page: React.FC = () => {
  const { transactionId } = useParams();
  const [transaction, setTransaction] = useState<AutoBrewingTransaction | null>(
    null
  );
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [versionGroups, setVersionGroups] = useState<VersionGroup[]>([]);
  const [playerStates, setPlayerStates] = useState<PlayerState[]>([]);
  const [currentPitchIndex, setCurrentPitchIndex] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const setSongMeta = useSetRecoilState(selectedSongMetaState);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId) return;

      try {
        const brewingRef = collection(db, Collections.AUTO_BREWING_TRANSACTION);
        const q = query(
          brewingRef,
          where("transactionId", "==", transactionId)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const transactionData =
            querySnapshot.docs[0].data() as AutoBrewingTransaction;
          setTransaction(transactionData);

          const groups = groupAudioPairs(transactionData.audioPairList);
          setVersionGroups(groups);
        }
      } catch (error) {
        console.error("Error fetching transaction:", error);
      }
    };

    fetchTransaction();
  }, [transactionId]);

  const groupAudioPairs = (audioPairs: any[]) => {
    const groups: { [key: string]: any[] } = {};

    audioPairs.forEach((pair) => {
      // 파일 경로에서 숫자_파일명 부분 추출
      const versionMatch = pair.resultUrl.match(/\/(\d+)_[^\/]+_result\.mp3$/);
      // URL에서 [pitch] 값 추출
      const pitchMatch = pair.resultUrl.match(/\[([^\]]+)\]/);

      if (versionMatch && pitchMatch) {
        const version = versionMatch[1]; // 버전 번호 (0, 1, 2, ...)
        const pitch = pitchMatch[1]; // pitch 값

        if (!groups[version]) {
          groups[version] = [];
        }

        groups[version].push({
          pitch,
          audioPair: pair,
        });
      }
    });

    // 버전별로 정렬하고, 각 버전 내에서 pitch별로 정렬
    const result = Object.entries(groups)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([version, pitchGroups]) => ({
        version,
        pitchGroups: pitchGroups.sort(
          (a, b) => Number(a.pitch) - Number(b.pitch)
        ),
      }));

    // 그룹핑 결과 로깅
    console.log("=== Grouped Audio Pairs ===");
    result.forEach((group, i) => {
      console.log(`\nVersion ${group.version}:`);
      group.pitchGroups.forEach((pg) => {
        console.log(`- Pitch ${pg.pitch}: ${pg.audioPair.resultUrl}`);
      });
    });

    return result;
  };

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

          audioRef.current.src = encodeURI(firstAudioPair.resultUrl);
          console.log("Playing URL:", encodeURI(firstAudioPair.resultUrl));
          audioRef.current.load();
          audioRef.current.currentTime = playerStates[index].currentTime;

          console.log("\n=== Now Playing ===");
          console.log(`Version: ${version}`);
          console.log(`Pitch: ${versionGroups[index].pitchGroups[0].pitch}`);
          console.log(`URL: ${firstAudioPair.resultUrl}`);
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
        const currentTime = audioRef.current.currentTime; // 현재 재생 위치 저장

        audioRef.current.src = newAudioPair.resultUrl;
        audioRef.current.load();

        // 이전 재생 위치로 복원
        audioRef.current.currentTime = currentTime;

        if (playerStates[index]?.isPlaying) {
          audioRef.current.play();
        }
      }
    }
  };

  const handleSelectComplete = () => {
    if (selectedVersion !== null && transaction) {
      const selectedAudioPair =
        versionGroups[selectedVersion].pitchGroups[currentPitchIndex].audioPair;

      const selectedData = {
        songRequestId: transaction.songRequestId,
        songTitle: transaction.songTitle,
        requestAt: transaction.timestamp,
        requestUserId: transaction.userId,
        resultAudioUrl: selectedAudioPair.resultUrl,
      };
      console.log("selectedData : " + selectedData);
      setSongMeta((prev) => ({
        audioUrl: selectedAudioPair.resultUrl,
        artwork: prev?.artwork || null, // artwork를 optional이 아닌 string | null로 명시
      }));
      navigate("/edit2");
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
          // onClick={() => handlePlayPause(group.version, index)}
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
export default Edit1Page;
