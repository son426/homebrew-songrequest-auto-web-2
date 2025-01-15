import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import MinusIcon from '../assets/pitchminus.svg';
import PlusIcon from '../assets/pitchplus.svg';
import { useSetRecoilState } from 'recoil';
import { selectedSongState } from '../atom';
import { useNavigate } from 'react-router-dom';
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

// 버전별 상태를 위한 인터페이스 추가
interface PlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}

const SelectVersion: React.FC = () => {
  const [inferenceData, setInferenceData] = useState<InferenceData | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [versionGroups, setVersionGroups] = useState<VersionGroup[]>([]);
  const [playerStates, setPlayerStates] = useState<PlayerState[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentPitchIndex, setCurrentPitchIndex] = useState<number>(0);
  const [selectedFinal, setSelectedFinal] = useState<boolean>(false);
  const setSelectedSong = useSetRecoilState(selectedSongState);
  const navigate = useNavigate();
  // 목업 데이터
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
          mrUrl: "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_mr.mp3",
          vocalUrl: "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_reverb.mp3",
          resultUrl: "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[-1]1_result.mp3"
        },
        {
          mrUrl: "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_mr.mp3",
          vocalUrl: "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_reverb.mp3",
          resultUrl: "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[-1]2_result.mp3"
        },
        {
          mrUrl: "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_mr.mp3",
          vocalUrl: "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_reverb.mp3",
          resultUrl: "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0]1_result.mp3"
        },
        {
          mrUrl: "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_mr.mp3",
          vocalUrl: "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_reverb.mp3",
          resultUrl: "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0]2_result.mp3"
        },
        {
          mrUrl: "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_mr.mp3",
          vocalUrl: "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_reverb.mp3",
          resultUrl: "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[1]1_result.mp3"
        },
        {
          mrUrl: "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_mr.mp3",
          vocalUrl: "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[0][model1]test/version1_reverb.mp3",
          resultUrl: "https://song-request-bucket-1.s3.ap-northeast-2.amazonaws.com/song-requests/Z9LwMPQx/[1]2_result.mp3"
        },
      ]
    };
    
    setInferenceData(mockData);

    // audioPairList를 버전별로 그룹화
    const groupByVersion = (audioPairs: AudioPair[]): VersionGroup[] => {
      const groups: { [key: string]: { pitch: string; audioPair: AudioPair }[] } = {};
      
      audioPairs.forEach(pair => {
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
          pitchGroups: pitchGroups.sort((a, b) => 
            Number(a.pitch) - Number(b.pitch)
          )
        }));
    };

    if (mockData.audioPairList) {
      setVersionGroups(groupByVersion(mockData.audioPairList));
    }
  }, []);

  // 버전별 상태 초기화
  useEffect(() => {
    if (versionGroups.length > 0) {
      setPlayerStates(versionGroups.map(() => ({
        currentTime: 0,
        duration: 0,
        isPlaying: false
      })));
    }
  }, [versionGroups]);

  const handlePlayPause = async (version: string, index: number) => {
    if (audioRef.current) {
      try {
        if (selectedVersion !== index) {
          // 현재 재생 중인 버전이 있다면 일시정지
          if (selectedVersion !== null) {
            const currentStates = [...playerStates];
            currentStates[selectedVersion] = {
              ...currentStates[selectedVersion],
              isPlaying: false
            };
            setPlayerStates(currentStates);
          }

          setSelectedVersion(index);
          const firstAudioPair = versionGroups[index].pitchGroups[0].audioPair;
          audioRef.current.src = firstAudioPair.resultUrl;
          audioRef.current.load();
          
          // 이전 재생 위치로 이동
          audioRef.current.currentTime = playerStates[index].currentTime;
        }

        const newPlayerStates = playerStates.map((state, i) => ({
          ...state,
          isPlaying: i === index ? !state.isPlaying : false
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
        currentTime: audioRef.current.currentTime
      };
      setPlayerStates(newPlayerStates);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && selectedVersion !== null) {
      const newPlayerStates = [...playerStates];
      newPlayerStates[selectedVersion] = {
        ...newPlayerStates[selectedVersion],
        duration: audioRef.current.duration
      };
      setPlayerStates(newPlayerStates);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const time = Number(e.target.value);
    if (audioRef.current && selectedVersion === index) {
      audioRef.current.currentTime = time;
      const newPlayerStates = [...playerStates];
      newPlayerStates[index] = {
        ...newPlayerStates[index],
        currentTime: time
      };
      setPlayerStates(newPlayerStates);
    }
  };

  const handlePitchChange = (index: number, direction: 'up' | 'down') => {
    if (!versionGroups[index]) return;
    
    const pitchGroups = versionGroups[index].pitchGroups;
    let newPitchIndex = currentPitchIndex;

    if (direction === 'up' && currentPitchIndex < pitchGroups.length - 1) {
      newPitchIndex = currentPitchIndex + 1;
    } else if (direction === 'down' && currentPitchIndex > 0) {
      newPitchIndex = currentPitchIndex - 1;
    }

    if (newPitchIndex !== currentPitchIndex) {
      setCurrentPitchIndex(newPitchIndex);
      
      if (audioRef.current) {
        const newAudioPair = pitchGroups[newPitchIndex].audioPair;
        audioRef.current.src = newAudioPair.resultUrl;
        audioRef.current.load();
        
        // 재생 중이었다면 계속 재생
        if (playerStates[index]?.isPlaying) {
          audioRef.current.play();
        }
      }
    }
  };

  const handleSelectComplete = () => {
    if (selectedVersion !== null && inferenceData) {
      // 선택된 버전의 오디오 URL 가져오기
      const selectedAudioPair = versionGroups[selectedVersion].pitchGroups[currentPitchIndex].audioPair;
      
      // Recoil state에 저장할 데이터 구성
      const selectedData = {
        songRequestId: inferenceData.songRequestId,
        songTitle: inferenceData.songTitle,
        guideId: inferenceData.guideId,
        voiceModel: inferenceData.voiceModel,
        isMan: inferenceData.isMan,
        requestAt: inferenceData.requestAt,
        requestUserId: inferenceData.requestUserId,
        resultAudioUrl: selectedAudioPair.resultUrl
      };
      
      // Recoil state 업데이트
      setSelectedSong(selectedData);
      setSelectedFinal(true);
      
      // 여기에 다음 페이지로 이동하는 로직 추가
      navigate('/select-album-cover');
    }
  };

  return (
    <Container>
      <Title>가장 마음에 드는 1개 버전을 선택해주세요.</Title>
      
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
      
      {versionGroups.map((group, index) => (
        <PlayerWrapper key={index} isSelected={selectedVersion === index}>
          {selectedVersion === index && (
            <PitchControls>
              <PitchButton onClick={() => handlePitchChange(index, 'down')}>
                <img src={MinusIcon} alt="decrease pitch" />
              </PitchButton>
              <PitchValue>
                {versionGroups[index].pitchGroups[currentPitchIndex].pitch}
              </PitchValue>
              <PitchButton onClick={() => handlePitchChange(index, 'up')}>
                <img src={PlusIcon} alt="increase pitch" />
              </PitchButton>
            </PitchControls>
          )}
          <VersionTitle>Ver {parseInt(group.version)}.</VersionTitle>
          <PlayerControls>
            <ControlsRow>
              <PlayButton onClick={() => handlePlayPause(group.version, index)}>
                {playerStates[index]?.isPlaying ? '■' : '▶'}
              </PlayButton>
              <ProgressBarWrapper>
                <ProgressBar
                  type="range"
                  min="0"
                  max={playerStates[index]?.duration || 0}
                  value={playerStates[index]?.currentTime || 0}
                  onChange={(e) => handleProgressChange(e, index)}
                />
                <TimeDisplay>
                  {Math.floor((playerStates[index]?.currentTime || 0) / 60)}:
                  {String(Math.floor((playerStates[index]?.currentTime || 0) % 60)).padStart(2, '0')}
                </TimeDisplay>
              </ProgressBarWrapper>
            </ControlsRow>
          </PlayerControls>
        </PlayerWrapper>
      ))}

      <SelectButton 
        disabled={selectedVersion === null} 
        onClick={handleSelectComplete}
      >
        선택 완료
      </SelectButton>
    </Container>
  );
};

const Container = styled.div`
  padding: 20px;
  padding-bottom: 80px;
  background-color: #000;
  color: white;
  min-height: 100vh;
`;

const Title = styled.h1`
  font-size: 18px;
  margin-bottom: 30px;
`;

const PlayerWrapper = styled.div<{ isSelected: boolean }>`
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 12px;
  background-color: ${props => props.isSelected ? '#333' : '#000'};
  transition: background-color 0.2s ease;
  position: relative;
`;

const VersionTitle = styled.div`
  font-size: 16px;
  margin-bottom: 10px;
`;

const PlayerControls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-direction: column;
`;

const PlayButton = styled.button`
  background: none;
  border: none;
  color: #FFD600;
  font-size: 24px;
  cursor: pointer;
`;

const ProgressBarWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ProgressBar = styled.input`
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  background: linear-gradient(
    to right,
    #FFD600 0%,
    #FFD600 50%,
    #444 50%,
    #444 100%
  );
  border-radius: 2px;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: #FFD600;
    border-radius: 50%;
    cursor: pointer;
  }
`;

const TimeDisplay = styled.span`
  font-size: 14px;
  color: #FFD600;
  min-width: 30px;
`;

const SelectButton = styled.button`
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  width: calc(100% - 40px);
  padding: 15px;
  background-color: ${props => props.disabled ? '#666' : '#FFD600'};
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  z-index: 1000;
`;

const PitchControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  position: absolute;
  top: 15px;
  right: 15px;
`;

const PitchButton = styled.button`
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFD600;
`;

const PitchValue = styled.span`
  color: #FFD600;
  font-size: 14px;
  min-width: 20px;
  text-align: center;
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
`;

export default SelectVersion; 