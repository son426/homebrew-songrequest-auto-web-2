import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { storage } from '../lib/firebase';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

const SelectAlbumCover = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [albumCovers, setAlbumCovers] = useState<string[]>([]);

  useEffect(() => {
    const fetchAlbumCovers = async () => {
      try {
        const thumbnailsRef = ref(storage, 'artistThumbnail/임재범');
        
        const result = await listAll(thumbnailsRef);
        
        const urlPromises = result.items.map(imageRef => getDownloadURL(imageRef));
        const urls = await Promise.all(urlPromises);
        
        setAlbumCovers(urls);
      } catch (error) {
        console.error('썸네일 이미지 가져오기 실패:', error);
      }
    };

    fetchAlbumCovers();
  }, []);

  const handleImageClick = (index: number) => {
    setSelectedImage(index);
  };

  return (
    <Container>
      <Title>앨범 커버를 골라주세요!</Title>
      <GridWrapper>
        <GridContainer>
          {albumCovers.map((cover, index) => (
            <ImageWrapper 
              key={index} 
              isSelected={selectedImage === index}
              onClick={() => handleImageClick(index)}
            >
              <CoverImage src={cover} alt={`앨범 커버 ${index + 1}`} />
            </ImageWrapper>
          ))}
        </GridContainer>
      </GridWrapper>
      <SubmitButton>곡 수령하기</SubmitButton>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #000;
  padding: 20px;
  padding-bottom: 90px;
`;

const Title = styled.h2`
  color: #fff;
  text-align: center;
  margin: 24px 0;
  font-size: 20px;
  font-weight: 600;
`;

const GridWrapper = styled.div`
  height: calc(100vh - 180px);
  overflow: hidden;
`;

const GridContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 0 16px;
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const ImageWrapper = styled.div<{ isSelected: boolean }>`
  position: relative;
  width: calc(50% - 10px);
  aspect-ratio: 16/9;
  border-radius: 8px;
  overflow: hidden;
  box-sizing: border-box;
  outline: ${props => props.isSelected ? '3px solid #FFD700' : 'none'};
  outline-offset: -3px;
  margin-bottom: 40px;
  
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.isSelected ? 'rgba(255, 215, 0, 0.1)' : 'transparent'};
  }
`;

const CoverImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const SubmitButton = styled.button`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #FFD700;
  color: #000;
  padding: 18px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  margin: 16px;
  border-radius: 8px;
  z-index: 10;
`;

export default SelectAlbumCover;
