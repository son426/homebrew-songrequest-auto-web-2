import React, { useState, useEffect, useRef } from "react";
import MinusIcon from "../assets/pitchminus.svg";
import PlusIcon from "../assets/pitchplus.svg";
import { useSetRecoilState } from "recoil";
import { useNavigate, useParams } from "react-router-dom";
import { AutoBrewingTransaction, Collections } from "../types/schema";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { selectedSongMetaState } from "../atom";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";

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
  const [pitchIndices, setPitchIndices] = useState<{ [version: string]: number }>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasPitchAdjusted, setHasPitchAdjusted] = useState<boolean>(false);
  const isLoadingRef = useRef<boolean>(false);

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

          // 트랜잭션 데이터를 가져온 후 바로 이미지 프리로드 시작
          const thumbnails = await fetchAlbumCovers(transactionData.existingArtist?.artistName || "");
          await preloadImages(thumbnails);
          
          // 프리로드된 이미지 URL들을 미리 저장
          setSongMeta((prev) => prev ? {
            ...prev,
            preloadedThumbnails: thumbnails,
          } : {
            audioUrl: null,
            artwork: null,
            preloadedThumbnails: thumbnails,
          });
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
      // 파일명에서 버전 번호 추출 (예: "0_result.mp3" -> "0")
      const versionMatch = pair.resultUrl.match(/\/(\d+)_result\.mp3$/);
      // URL에서 첫 번째 대괄호 안의 pitch 값 추출 (예: "[-1][ljb]" -> "-1")
      const pitchMatch = pair.resultUrl.match(/\[([-\d]+)\]/);

      if (versionMatch && pitchMatch) {
        const version = versionMatch[1]; // 버전 번호
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

  const handlePlayPause = async (
    version: string,
    index: number,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }

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
          const firstAudioPair =
            versionGroups[index].pitchGroups[pitchIndices[version] || 0].audioPair;
          
          console.log(`재생 시도 - Version ${version}, resultUrl:`, firstAudioPair.resultUrl);
          
          const url = new URL(firstAudioPair.resultUrl);
          const encodedUrl = url.toString();
          
          audioRef.current.src = encodedUrl;
          await audioRef.current.load();
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
          await audioRef.current.play().catch(error => {
            console.error("Audio play error:", error);
            alert("오디오 재생 중 오류가 발생했습니다. 다시 시도해주세요.");
          });
        }
      } catch (error) {
        console.error("Audio playback error:", error);
        alert("오디오 URL 처리 중 오류가 발생했습니다.");
      }
    }
  };

  const handleProgressChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    e.stopPropagation();
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

  const handlePitchChange = async (
    e: React.MouseEvent,
    index: number,
    direction: "up" | "down"
  ) => {
    e.stopPropagation();
    if (!versionGroups[index] || isLoadingRef.current) return;

    setHasPitchAdjusted(true);

    const version = versionGroups[index].version;
    const pitchGroups = versionGroups[index].pitchGroups;
    const currentIndex = pitchIndices[version] || 0;
    let newPitchIndex = currentIndex;

    if (direction === "up" && currentIndex < pitchGroups.length - 1) {
      newPitchIndex = currentIndex + 1;
    } else if (direction === "down" && currentIndex > 0) {
      newPitchIndex = currentIndex - 1;
    }

    if (newPitchIndex !== currentIndex) {
      isLoadingRef.current = true;
      setPitchIndices(prev => ({
        ...prev,
        [version]: newPitchIndex
      }));
      
      if (audioRef.current) {
        try {
          const newAudioPair = pitchGroups[newPitchIndex].audioPair;
          const currentTime = audioRef.current.currentTime;
          const wasPlaying = playerStates[index]?.isPlaying;
          
          if (wasPlaying) {
            await audioRef.current.pause();
          }
          
          audioRef.current.src = newAudioPair.resultUrl;
          await audioRef.current.load();
          audioRef.current.currentTime = currentTime;

          if (wasPlaying) {
            await audioRef.current.play();
          }
        } catch (error) {
          console.error("오디오 로딩 중 오류 발생:", error);
        } finally {
          isLoadingRef.current = false;
        }
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

  const fetchAlbumCovers = async (artistName: string) => {
    try {
      const thumbnailsRef = ref(storage, `artistThumbnail/${artistName}`);
      const result = await listAll(thumbnailsRef);
      const urlPromises = result.items.map((imageRef) => getDownloadURL(imageRef));
      return await Promise.all(urlPromises);
    } catch (error) {
      console.error("썸네일 이미지 가져오기 실패:", error);
      return [];
    }
  };

  const preloadImages = (urls: string[]) => {
    return Promise.all(
      urls.map((url) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(url);
          img.onerror = reject;
          img.src = url;
        });
      })
    );
  };

  const handleSelectComplete = () => {
    if (selectedVersion !== null && transaction) {
      const version = versionGroups[selectedVersion].version;
      const currentPitchIndex = pitchIndices[version] || 0;
      const selectedAudioPair =
        versionGroups[selectedVersion].pitchGroups[currentPitchIndex].audioPair;

      setSongMeta((prev) => ({
        ...prev,
        audioUrl: selectedAudioPair.resultUrl,
        artwork: prev?.artwork || null,
      }));
      
      navigate("/edit2");
    }
  };

  return (
    <div className="min-h-screen bg-black p-5 pb-20 text-white">
      <div className="mt-16 mb-12 ml-4">
        <h1 className="text-2xl font-semibold">마음에 드는 버전을 골라주세요!</h1>
        <p className="mt-2 text-sm text-neutral-400">
          전반적으로 가장 괜찮은 버전을 골라주세요. <br/>
          부분 수정은 이후에 할 수 있어요.
        </p>
      </div>

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
            <div
              className="absolute right-4 top-4 flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {!hasPitchAdjusted && (
                <div className="absolute right-0 -top-20 w-[140px] rounded-lg bg-yellow-400 p-2 text-sm text-black text-center">
                  키를 조절해보세요!
                  <div className="absolute bottom-[-8px] right-8 h-4 w-4 rotate-45 bg-yellow-400"></div>
                </div>
              )}
              <button
                onClick={(e) => handlePitchChange(e, index, "down")}
                disabled={(pitchIndices[group.version] || 0) === 0}
                className={`flex h-6 w-6 items-center justify-center focus:outline-none ${
                  (pitchIndices[group.version] || 0) === 0
                    ? "cursor-not-allowed bg-neutral-800 opacity-30"
                    : "text-yellow-400 active:opacity-70"
                }`}
              >
                <img src={MinusIcon} alt="decrease pitch" className="w-full" />
              </button>
              <span className="min-w-[20px] text-center text-sm text-yellow-400">
                {versionGroups[index].pitchGroups[pitchIndices[group.version] || 0].pitch}
              </span>
              <button
                onClick={(e) => handlePitchChange(e, index, "up")}
                disabled={
                  (pitchIndices[group.version] || 0) ===
                  versionGroups[index].pitchGroups.length - 1
                }
                className={`flex h-6 w-6 items-center justify-center focus:outline-none ${
                  (pitchIndices[group.version] || 0) ===
                  versionGroups[index].pitchGroups.length - 1
                    ? "cursor-not-allowed bg-neutral-800 opacity-30"
                    : "text-yellow-400 active:opacity-70"
                }`}
              >
                <img src={PlusIcon} alt="increase pitch" className="w-full" />
              </button>
            </div>
          )}

          <div className="mb-3 text-base">Ver {parseInt(group.version)}.</div>

          <div
            className="flex w-full items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => handlePlayPause(group.version, index, e)}
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
                onChange={(e) => handleProgressChange(e, index)}
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

      <div className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-black via-black to-transparent pb-5 pt-10">
        <button
          disabled={selectedVersion === null}
          onClick={handleSelectComplete}
          className={`mx-5 w-[calc(100%-40px)] rounded-xl py-4 text-base font-bold ${
            selectedVersion === null
              ? "cursor-not-allowed bg-neutral-600 opacity-50"
              : "cursor-pointer bg-yellow-400 text-black"
          }`}
        >
          선택 완료
        </button>
      </div>
    </div>
  );
};

export default Edit1Page;
