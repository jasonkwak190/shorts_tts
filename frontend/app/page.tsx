"use client";

import { useState, useRef, useEffect } from "react";

interface Segment {
  id: string;
  text: string;
  audioUrl?: string;
  isGenerating?: boolean;
  audioDuration?: number;
  imageUrl?: string;
  imageName?: string;
  subtitlePosition?: { x: number; y: number };
  isThumbnail?: boolean;
  order?: number;
  backgroundImageUrl?: string;
  imagePosition?: { x: number; y: number; scale: number };
  textColor?: string;
  textSize?: number;
}

const AudioPlayer = ({ audioUrl, onDurationLoad }: { audioUrl: string, onDurationLoad?: (duration: number) => void }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      onDurationLoad?.(audio.duration);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [audioUrl, onDurationLoad]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <audio ref={audioRef} src={audioUrl} />
      
      <button
        onClick={togglePlay}
        className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700"
      >
        {isPlaying ? (
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-white"></div>
            <div className="w-1 h-3 bg-white"></div>
          </div>
        ) : (
          <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-0.5"></div>
        )}
      </button>

      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 bg-gray-300 rounded-full h-1">
          <div 
            className="bg-blue-600 h-1 rounded-full transition-all duration-100"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          ></div>
        </div>
        <span className="text-xs text-gray-600 min-w-[60px]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

export default function Home() {
  const [topic, setTopic] = useState("");
  const [script, setScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [showSegments, setShowSegments] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("female1");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [globalBackgroundImage, setGlobalBackgroundImage] = useState<string>("");
  const [globalBackgroundImageName, setGlobalBackgroundImageName] = useState<string>("");
  const [pendingTextChanges, setPendingTextChanges] = useState<{[key: string]: string}>({});
  const [thumbnailText, setThumbnailText] = useState<string>("썸네일 제목을 입력하세요");
  const [thumbnailPosition, setThumbnailPosition] = useState<{x: number; y: number}>({x: 50, y: 30});
  const [thumbnailImage, setThumbnailImage] = useState<string>("");
  const [thumbnailImageName, setThumbnailImageName] = useState<string>("");
  const [thumbnailImagePosition, setThumbnailImagePosition] = useState<{x: number; y: number; scale: number}>({x: 50, y: 50, scale: 1});
  const [showThumbnailText, setShowThumbnailText] = useState<boolean>(true);
  const [thumbnailDuration, setThumbnailDuration] = useState<number>(1);
  const [thumbnailTextColor, setThumbnailTextColor] = useState<string>('#ffffff');
  const [thumbnailTextSize, setThumbnailTextSize] = useState<number>(32);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null); // 선택된 세그먼트
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [videoResult, setVideoResult] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<number>(1); // 1: 스크립트, 2: TTS, 3: 이미지, 4: 비디오
  const [completionNotifications, setCompletionNotifications] = useState<string[]>([]); // TTS 완료 알림
  const [applyToAllSegments, setApplyToAllSegments] = useState<boolean>(false); // 전체 세그먼트에 텍스트 설정 적용

  // 세그먼트가 생성되면 첫 번째 세그먼트 자동 선택
  useEffect(() => {
    if (segments.length > 0 && !selectedSegmentId) {
      setSelectedSegmentId(segments[0].id);
    }
  }, [segments, selectedSegmentId]);

  const generateScript = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate script');
      }

      const data = await response.json();
      setScript(data.script);
    } catch (error) {
      console.error("Script generation failed:", error);
      setScript("스크립트 생성에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateTTSForSegment = async (segmentId: string, text: string, voice: string) => {
    setSegments(prev => prev.map(s => 
      s.id === segmentId ? { ...s, isGenerating: true } : s
    ));

    try {
      // Mock TTS API call - 실제로는 FastAPI 백엔드 호출
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 가짜 오디오 파일 생성 (실제 샘플 오디오 사용)
      const mockAudioUrl = "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav";
      const mockDuration = 2; // TTS 모크 데이터: 2초 고정 (실제 가짜 오디오 길이)
      
      setSegments(prev => prev.map(s => 
        s.id === segmentId ? { 
          ...s, 
          audioUrl: mockAudioUrl, 
          audioDuration: mockDuration,
          isGenerating: false 
        } : s
      ));
      
      // TTS 완료 알림 추가
      const segmentIndex = segments.findIndex(s => s.id === segmentId);
      const message = `세그먼트 ${segmentIndex + 1}번 TTS 완료!`;
      setCompletionNotifications(prev => [...prev, message]);
      
      // 3초 후 알림 제거
      setTimeout(() => {
        setCompletionNotifications(prev => prev.filter(n => n !== message));
      }, 3000);
    } catch (error) {
      console.error("TTS generation failed:", error);
      setSegments(prev => prev.map(s => 
        s.id === segmentId ? { ...s, isGenerating: false } : s
      ));
    }
  };

  const generateAllTTS = async () => {
    const segmentsToGenerate = segments.filter(s => !s.audioUrl);
    
    for (const segment of segmentsToGenerate) {
      await generateTTSForSegment(segment.id, segment.text, selectedVoice);
    }
  };

  const handleImageUpload = (segmentId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setSegments(prev => prev.map(s => 
        s.id === segmentId ? { 
          ...s, 
          imageUrl,
          imageName: file.name,
          subtitlePosition: { x: 50, y: 80 }, // 기본 위치 (중앙 하단)
          imagePosition: { x: 50, y: 50, scale: 1.5 } // 기본 크기 1.5배
        } : s
      ));
    };
    reader.readAsDataURL(file);
  };

  const handleMultipleImageUpload = (files: FileList) => {
    const filesArray = Array.from(files);
    const segmentsWithoutImages = segments.filter(s => !s.imageUrl);
    
    filesArray.forEach((file, index) => {
      if (index < segmentsWithoutImages.length) {
        const targetSegment = segmentsWithoutImages[index];
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          setSegments(prev => prev.map(s => 
            s.id === targetSegment.id ? { 
              ...s, 
              imageUrl,
              imageName: file.name,
              subtitlePosition: { x: 50, y: 80 },
              imagePosition: { x: 50, y: 50, scale: 1.5 } // 기본 크기 1.5배
            } : s
          ));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleGlobalBackgroundImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const backgroundImageUrl = e.target?.result as string;
      setGlobalBackgroundImage(backgroundImageUrl);
      setGlobalBackgroundImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const updateSubtitlePosition = (segmentId: string, x: number, y: number) => {
    setSegments(prev => prev.map(s => 
      s.id === segmentId ? { 
        ...s, 
        subtitlePosition: { x, y }
      } : s
    ));
  };

  const moveSegment = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newSegments = [...segments];
    const [movedSegment] = newSegments.splice(fromIndex, 1);
    newSegments.splice(toIndex, 0, movedSegment);
    
    // 순서 재정렬
    const reorderedSegments = newSegments.map((segment, index) => ({
      ...segment,
      order: index + 1
    }));
    
    setSegments(reorderedSegments);
  };

  const confirmTextChange = (segmentId: string) => {
    const newText = pendingTextChanges[segmentId];
    if (!newText) return;
    
    setSegments(prev => prev.map(s => 
      s.id === segmentId ? { 
        ...s, 
        text: newText,
        // 텍스트 변경시에만 TTS 초기화 (이미지는 유지)
        audioUrl: !s.isThumbnail ? undefined : s.audioUrl,
        audioDuration: !s.isThumbnail ? undefined : s.audioDuration
      } : s
    ));
    
    // 대기 중인 변경사항에서 제거
    setPendingTextChanges(prev => {
      const newPending = { ...prev };
      delete newPending[segmentId];
      return newPending;
    });
  };

  // 텍스트 색상 업데이트 (전체 적용 옵션 고려)
  const updateTextColor = (segmentId: string, color: string) => {
    if (applyToAllSegments) {
      // 모든 세그먼트에 적용
      setSegments(prev => prev.map(s => ({ ...s, textColor: color })));
    } else {
      // 선택된 세그먼트에만 적용
      setSegments(prev => prev.map(s => 
        s.id === segmentId ? { ...s, textColor: color } : s
      ));
    }
  };

  // 텍스트 크기 업데이트 (전체 적용 옵션 고려)
  const updateTextSize = (segmentId: string, size: number) => {
    if (applyToAllSegments) {
      // 모든 세그먼트에 적용
      setSegments(prev => prev.map(s => ({ ...s, textSize: size })));
    } else {
      // 선택된 세그먼트에만 적용
      setSegments(prev => prev.map(s => 
        s.id === segmentId ? { ...s, textSize: size } : s
      ));
    }
  };

  // 썸네일 텍스트 크기 변경 시 모든 세그먼트에 동기화
  const updateThumbnailTextSize = (size: number) => {
    setThumbnailTextSize(size);
    // 모든 세그먼트에 동일한 크기 적용
    setSegments(prev => prev.map(s => ({ ...s, textSize: size })));
  };

  // 썸네일 텍스트 색상 변경 시 모든 세그먼트에 동기화
  const updateThumbnailTextColor = (color: string) => {
    setThumbnailTextColor(color);
    // 모든 세그먼트에 동일한 색상 적용
    setSegments(prev => prev.map(s => ({ ...s, textColor: color })));
  };

  const generateVideo = async () => {
    setIsGeneratingVideo(true);
    try {
      console.log("=== 실제 비디오 생성 시작 ===");
      
      // Canvas 설정 (9:16 비율 - 고화질)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = 1080;
      canvas.height = 1920;
      
      const stream = canvas.captureStream(30); // 30fps
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8',
        videoBitsPerSecond: 2500000
      });
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstart = () => console.log("Recording started");
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setVideoResult(videoUrl);
        setIsGeneratingVideo(false);
        console.log("=== 비디오 생성 완료 ===");
      };

      // 이미지 로드 함수
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      // 배경 이미지 로드
      let backgroundImg: HTMLImageElement | null = null;
      if (globalBackgroundImage) {
        backgroundImg = await loadImage(globalBackgroundImage);
      }

      // 썸네일 이미지 로드
      let thumbnailImg: HTMLImageElement | null = null;
      if (thumbnailImage) {
        thumbnailImg = await loadImage(thumbnailImage);
      }

      // 세그먼트 이미지들 로드
      const segmentImages: (HTMLImageElement | null)[] = [];
      for (const segment of segments) {
        if (segment.imageUrl) {
          segmentImages.push(await loadImage(segment.imageUrl));
        } else {
          segmentImages.push(null);
        }
      }

      mediaRecorder.start();

      let currentTime = 0;
      const fps = 30;
      const frameInterval = 1000 / fps;

      // 프레임 렌더링 함수
      const renderFrame = (time: number) => {
        // 배경 그리기
        if (backgroundImg) {
          ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
        } else {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 썸네일 단계 (처음 thumbnailDuration초)
        if (time < thumbnailDuration) {
          // 썸네일 이미지 (미리보기와 완전히 동일한 비율과 위치)
          if (thumbnailImg) {
            // 미리보기 640px 높이 → 캔버스 1920px 높이 비율 정확히 계산
            const previewHeight = 640;
            const canvasHeight = 1920;
            const scaleFactor = canvasHeight / previewHeight;
            
            // 미리보기와 동일한 크기 (150x100)를 비율에 맞춰 확대
            const imgWidth = 150 * scaleFactor;
            const imgHeight = 100 * scaleFactor;
            
            // 미리보기와 동일한 위치 계산
            const x = (canvas.width * thumbnailImagePosition.x / 100) - imgWidth/2;
            const y = (canvas.height * thumbnailImagePosition.y / 100) - imgHeight/2;
            
            // 고품질 이미지 렌더링 (지주함 방지, 비율 유지)
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // 원본 비율 유지하면서 그리기
            const aspectRatio = thumbnailImg.naturalWidth / thumbnailImg.naturalHeight;
            const targetWidth = imgWidth * thumbnailImagePosition.scale;
            const targetHeight = imgHeight * thumbnailImagePosition.scale;
            
            // 비율 유지를 위한 크기 조정
            let finalWidth = targetWidth;
            let finalHeight = targetHeight;
            
            if (aspectRatio > (targetWidth / targetHeight)) {
              // 가로가 더 긴 경우
              finalHeight = targetWidth / aspectRatio;
            } else {
              // 세로가 더 긴 경우
              finalWidth = targetHeight * aspectRatio;
            }
            
            ctx.drawImage(
              thumbnailImg, 
              x - finalWidth/2, 
              y - finalHeight/2, 
              finalWidth, 
              finalHeight
            );
          }

          // 썸네일 텍스트 (사용자 정의 스타일 적용)
          if (showThumbnailText) {
            ctx.fillStyle = thumbnailTextColor;
            ctx.font = `bold ${thumbnailTextSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            const x = canvas.width * thumbnailPosition.x / 100;
            const y = canvas.height * thumbnailPosition.y / 100;
            ctx.fillText(thumbnailText, x, y);
          }
        } 
        // 세그먼트 단계
        else {
          let segmentStartTime = thumbnailDuration;
          let currentSegmentIndex = -1;
          
          // 현재 시간에 해당하는 세그먼트 찾기
          for (let i = 0; i < segments.length; i++) {
            const segmentEndTime = segmentStartTime + (segments[i].audioDuration || 2);
            if (time >= segmentStartTime && time < segmentEndTime) {
              currentSegmentIndex = i;
              break;
            }
            segmentStartTime = segmentEndTime;
          }

          if (currentSegmentIndex >= 0) {
            const segment = segments[currentSegmentIndex];
            
            // 썸네일 텍스트 (사용자 정의 스타일 적용)
            if (showThumbnailText) {
              ctx.fillStyle = thumbnailTextColor;
              ctx.font = `bold ${thumbnailTextSize}px Arial`;
              ctx.textAlign = 'center';
              ctx.shadowColor = 'black';
              ctx.shadowBlur = 4;
              ctx.shadowOffsetX = 2;
              ctx.shadowOffsetY = 2;
              
              const x = canvas.width * thumbnailPosition.x / 100;
              const y = canvas.height * thumbnailPosition.y / 100;
              ctx.fillText(thumbnailText, x, y);
            }

            // 세그먼트 이미지 (미리보기와 완전히 동일한 비율과 위치)
            const segmentImg = segmentImages[currentSegmentIndex];
            if (segmentImg) {
              // 미리보기 640px 높이 → 캔버스 1920px 높이 비율 정확히 계산
              const previewHeight = 640;
              const canvasHeight = 1920;
              const scaleFactor = canvasHeight / previewHeight;
              
              // 미리보기와 동일한 크기 (150x100)를 비율에 맞춰 확대
              const imgWidth = 150 * scaleFactor;
              const imgHeight = 100 * scaleFactor;
              
              // 미리보기와 동일한 위치 계산
              const imgX = (canvas.width * (segment.imagePosition?.x || 50) / 100) - imgWidth/2;
              const imgY = (canvas.height * (segment.imagePosition?.y || 50) / 100) - imgHeight/2;
              
              // 고품질 이미지 렌더링 (지주함 방지, 비율 유지)
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              
              // 원본 비율 유지하면서 그리기
              const aspectRatio = segmentImg.naturalWidth / segmentImg.naturalHeight;
              const targetWidth = imgWidth * (segment.imagePosition?.scale || 1);
              const targetHeight = imgHeight * (segment.imagePosition?.scale || 1);
              
              // 비율 유지를 위한 크기 조정
              let finalWidth = targetWidth;
              let finalHeight = targetHeight;
              
              if (aspectRatio > (targetWidth / targetHeight)) {
                // 가로가 더 긴 경우
                finalHeight = targetWidth / aspectRatio;
              } else {
                // 세로가 더 긴 경우
                finalWidth = targetHeight * aspectRatio;
              }
              
              ctx.drawImage(
                segmentImg, 
                imgX - finalWidth/2, 
                imgY - finalHeight/2, 
                finalWidth, 
                finalHeight
              );
            }

            // 세그먼트 자막 (사용자 정의 스타일 적용)
            ctx.fillStyle = segment.textColor || 'white';
            // 미리보기 → 캔버스 비율 정확히 맞춤
            const previewHeight = 640;
            const canvasHeight = 1920;
            const baseFontSize = segment.textSize || 24;
            const fontSize = Math.round(baseFontSize * (canvasHeight / previewHeight));
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            // 미리보기와 동일한 위치 계산
            const subtitleX = canvas.width * (segment.subtitlePosition?.x || 50) / 100;
            const subtitleY = canvas.height * (segment.subtitlePosition?.y || 75) / 100;
            
            // 긴 텍스트 줄바꿈 처리
            const words = segment.text.split(' ');
            let line = '';
            let lineY = subtitleY;
            
            for (let n = 0; n < words.length; n++) {
              const testLine = line + words[n] + ' ';
              const metrics = ctx.measureText(testLine);
              const testWidth = metrics.width;
              
              if (testWidth > canvas.width * 0.8 && n > 0) {
                ctx.fillText(line, subtitleX, lineY);
                line = words[n] + ' ';
                // 줄 간격도 비율에 맞춰 조정
                lineY += Math.round(30 * (canvasHeight / previewHeight));
              } else {
                line = testLine;
              }
            }
            ctx.fillText(line, subtitleX, lineY);
          }
        }
      };

      // 총 비디오 길이 계산 (썸네일 + 세그먼트 TTS)
      const totalDuration = thumbnailDuration + segments.reduce((acc, s) => acc + (s.audioDuration || 2), 0);
      console.log("=== 비디오 길이 계산 ===");
      console.log("썸네일 길이:", thumbnailDuration + "초");
      console.log("세그먼트 수:", segments.length);
      console.log("세그먼트별 TTS 길이:", segments.map(s => (s.audioDuration || 5) + "초"));
      console.log("계산된 총 길이:", totalDuration + "초");

      // 애니메이션 루프 - requestAnimationFrame 사용
      let frameCount = 0;
      const totalFrames = Math.floor(totalDuration * fps);
      
      const animate = () => {
        currentTime = frameCount / fps;
        renderFrame(currentTime);
        frameCount++;
        
        if (frameCount < totalFrames) {
          setTimeout(animate, frameInterval);
        } else {
          mediaRecorder.stop();
        }
      };

      animate();

    } catch (error) {
      console.error("Video generation failed:", error);
      alert("비디오 생성에 실패했습니다: " + error);
      setIsGeneratingVideo(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">YouTube Shorts 생성기</h1>
        
        {/* 단계 표시 */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              currentStep === 1 ? 'bg-blue-600 text-white' : 
              currentStep > 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              <span className="w-5 h-5 rounded-full bg-white text-blue-600 flex items-center justify-center text-xs font-bold">
                {currentStep > 1 ? '✓' : '1'}
              </span>
              <span className="font-medium text-sm">스크립트</span>
            </div>
            <div className="w-6 h-1 bg-gray-300"></div>
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              currentStep === 2 ? 'bg-blue-600 text-white' : 
              currentStep > 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              <span className="w-5 h-5 rounded-full bg-white text-blue-600 flex items-center justify-center text-xs font-bold">
                {currentStep > 2 ? '✓' : '2'}
              </span>
              <span className="font-medium text-sm">TTS</span>
            </div>
            <div className="w-6 h-1 bg-gray-300"></div>
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              currentStep === 3 ? 'bg-blue-600 text-white' : 
              currentStep > 3 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              <span className="w-5 h-5 rounded-full bg-white text-blue-600 flex items-center justify-center text-xs font-bold">
                {currentStep > 3 ? '✓' : '3'}
              </span>
              <span className="font-medium text-sm">이미지</span>
            </div>
            <div className="w-6 h-1 bg-gray-300"></div>
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              currentStep === 4 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              <span className="w-5 h-5 rounded-full bg-white text-blue-600 flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span className="font-medium text-sm">비디오</span>
            </div>
          </div>
        </div>
        
        {/* TTS 완료 알림 */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {completionNotifications.map((notification, index) => (
            <div key={index} className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
              ✓ {notification}
            </div>
          ))}
        </div>
        
        {/* 1단계: 스크립트 입력 */}
        {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. 스크립트 입력</h2>
          
          {/* AI 생성 옵션 */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium mb-2">AI로 스크립트 생성 (선택사항)</h3>
            <div className="flex gap-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="주제를 입력하세요... (예: 재미있는 과학 실험)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={generateScript}
                disabled={!topic.trim() || isGenerating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isGenerating ? "생성 중..." : "AI 생성"}
              </button>
            </div>
          </div>

          {/* 직접 입력 옵션 */}
          <div>
            <h3 className="font-medium mb-2">또는 직접 스크립트 입력</h3>
            <p className="text-sm text-blue-600 mb-2">💡 엔터를 누르면 자동으로 세그먼트가 분할됩니다</p>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="YouTube Shorts 스크립트를 직접 입력하세요...&#10;각 줄마다 엔터를 눌러 세그먼트를 나누세요&#10;&#10;예시:&#10;안녕하세요!&#10;오늘은 재미있는 실험을 해볼게요&#10;준비물은 이것입니다"
            />
          </div>

          {script && (
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => {
                  const lines = script.split('\n').filter(s => s.trim().length > 0);
                  const newSegments = lines.map((line, index) => ({
                    id: `segment-${index}`,
                    text: line.trim(),
                    isThumbnail: false,
                    order: index + 1,
                    subtitlePosition: { x: 50, y: 75 },
                    imagePosition: { x: 50, y: 50, scale: 1.5 }
                  }));
                  setSegments(newSegments);
                  setShowSegments(true);
                  setCurrentStep(2);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                다음 단계: 분할하기
              </button>
            </div>
          )}
        </div>
        )}


        {/* 2단계: TTS 생성 */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">2. 스크립트 분할 및 TTS 생성</h2>
            <div className="mb-6">
              <p className="text-gray-600 mb-2">각 문장을 개별 음성으로 생성합니다. 필요시 수정하거나 추가/삭제할 수 있습니다.</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-700">
                  ⏱️ <strong>TTS 생성은 시간이 소요됩니다.</strong> 생성 중에도 이미지 업로드 작업을 병행하실 수 있습니다!
                </p>
              </div>
            </div>

            {/* TTS 일괄 생성 섹션 - 상단으로 이동 */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">🎵 TTS 일괄 생성</h3>
              <p className="text-sm text-blue-700 mb-3">모든 세그먼트의 음성을 한 번에 생성합니다.</p>
              <button 
                onClick={generateAllTTS}
                disabled={segments.some(s => s.isGenerating) || segments.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
              >
                {segments.some(s => s.isGenerating) ? '생성 중...' : `${segments.filter(s => !s.audioUrl).length}개 세그먼트 TTS 생성`}
              </button>
            </div>
            
            {/* 목소리 선택 */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-3">목소리 선택</h3>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="voice"
                    value="female1"
                    checked={selectedVoice === "female1"}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="mr-2"
                  />
                  여성 1 (부드러운 목소리)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="voice"  
                    value="female2"
                    checked={selectedVoice === "female2"}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="mr-2"
                  />
                  여성 2 (활기찬 목소리)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="voice"
                    value="male1"
                    checked={selectedVoice === "male1"}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="mr-2"
                  />
                  남성 1 (차분한 목소리)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="voice"
                    value="male2"
                    checked={selectedVoice === "male2"}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="mr-2"
                  />
                  남성 2 (힘찬 목소리)
                </label>
              </div>
            </div>
            
            <div className="space-y-4">
              {segments.map((segment, index) => (
                <div key={segment.id} className="border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        세그먼트 {segment.order || index + 1}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSegments(segments.filter(s => s.id !== segment.id));
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                  <textarea
                    value={segment.text}
                    onChange={(e) => {
                      const newText = e.target.value;
                      const hasChanged = newText !== segment.text;
                      
                      setSegments(segments.map(s => 
                        s.id === segment.id ? { 
                          ...s, 
                          text: newText,
                          // 텍스트 변경시에만 TTS 초기화 (이미지는 유지)
                          audioUrl: hasChanged ? undefined : s.audioUrl,
                          audioDuration: hasChanged ? undefined : s.audioDuration
                        } : s
                      ));
                    }}
                    className="w-full h-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="텍스트 입력..."
                  />
                  
                  {/* TTS 컨트롤 */}
                  <div className="mt-3 flex items-center gap-3">
                    {!segment.audioUrl && !segment.isGenerating && (
                      <button
                        onClick={() => generateTTSForSegment(segment.id, segment.text, selectedVoice)}
                        disabled={!segment.text.trim()}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        TTS 생성
                      </button>
                    )}
                    
                    {segment.isGenerating && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        음성 생성 중...
                      </div>
                    )}
                    
                    {segment.audioUrl && !segment.isGenerating && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-600">생성 완료</span>
                          </div>
                          <button
                            onClick={() => generateTTSForSegment(segment.id, segment.text, selectedVoice)}
                            className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                          >
                            재생성
                          </button>
                        </div>
                        <AudioPlayer 
                          audioUrl={segment.audioUrl}
                          onDurationLoad={(duration) => {
                            setSegments(prev => prev.map(s => 
                              s.id === segment.id ? { ...s, audioDuration: duration } : s
                            ));
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={() => {
                  const newSegment = {
                    id: `segment-${segments.length}`,
                    text: ""
                  };
                  setSegments([...segments, newSegment]);
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
              >
                + 새 세그먼트 추가
              </button>
            </div>


            <div className="mt-6 flex justify-between items-center">
              <button 
                onClick={() => setShowSegments(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                이전 단계
              </button>
              
              <button 
                onClick={() => {
                  setShowImageUpload(true);
                  setCurrentStep(3);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                다음 단계 →
              </button>
            </div>
          </div>
        )}

        {/* 이미지 업로드 및 자막 설정 섹션 */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">3. 이미지 설정</h2>
            <div className="mb-6">
              <p className="text-gray-600 mb-2">썸네일과 각 세그먼트의 이미지를 업로드하고 위치를 설정하세요.</p>
              
              {/* 일괄 업로드 섹션 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-green-800 mb-2">📤 여러 이미지 한번에 업로드</h3>
                <p className="text-sm text-green-700 mb-3">이미지가 없는 세그먼트부터 순서대로 자동 할당됩니다.</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      handleMultipleImageUpload(e.target.files);
                      e.target.value = ''; // 같은 파일 재선택 가능하도록
                    }
                  }}
                  className="hidden"
                  id="multiple-image-upload"
                />
                <label
                  htmlFor="multiple-image-upload"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700"
                >
                  📷 여러 이미지 선택
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  🔄 <strong>세그먼트 순서 변경:</strong> 세그먼트들은 드래그로 순서를 변경할 수 있습니다.
                </p>
              </div>
            </div>

            {/* 썸네일 및 배경 설정 섹션 */}
            <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
              <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
                🎬 썸네일 및 배경 설정
              </h3>
              
              <div className="grid grid-cols-3 gap-6">
                {/* 썸네일 텍스트 설정 */}
                <div className="space-y-4 h-64 flex flex-col">
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={showThumbnailText}
                        onChange={(e) => setShowThumbnailText(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="font-medium">썸네일 텍스트 표시</span>
                    </label>
                    {showThumbnailText && (
                      <textarea
                        value={thumbnailText}
                        onChange={(e) => setThumbnailText(e.target.value)}
                        className="w-full p-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 resize-none"
                        rows={3}
                        placeholder="썸네일 제목 입력..."
                      />
                    )}
                  </div>
                  
                  {/* 썸네일 지속 시간 설정 */}
                  <div>
                    <label className="block font-medium mb-2">썸네일 지속 시간</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.5"
                        max="5"
                        step="0.5"
                        value={thumbnailDuration}
                        onChange={(e) => setThumbnailDuration(parseFloat(e.target.value))}
                        className="w-20 p-2 border-2 border-purple-300 rounded focus:border-purple-500"
                      />
                      <span className="text-sm text-purple-600">초</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">썸네일이 영상 시작에 표시될 시간</p>
                  </div>
                </div>

                {/* 썸네일 이미지 설정 */}
                <div className="h-64 flex flex-col">
                  <h4 className="font-medium mb-2">썸네일 이미지</h4>
                  {!thumbnailImage ? (
                    <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center flex-1 flex flex-col justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setThumbnailImage(e.target?.result as string);
                              setThumbnailImageName(file.name);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="thumbnail-image-upload"
                      />
                      <label htmlFor="thumbnail-image-upload" className="cursor-pointer block">
                        <div className="text-purple-400 mb-2 text-2xl">🖼️</div>
                        <p className="text-sm text-purple-600">썸네일 이미지 업로드</p>
                      </label>
                    </div>
                  ) : (
                    <div className="p-4 bg-purple-100 border-2 border-purple-300 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-purple-400 mb-1 text-lg">🖼️</div>
                          <p className="text-sm text-purple-600 font-medium">{thumbnailImageName}</p>
                        </div>
                        <button
                          onClick={() => {
                            setThumbnailImage("");
                            setThumbnailImageName("");
                          }}
                          className="bg-red-500 text-white w-6 h-6 rounded-full text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 배경 이미지 설정 */}
                <div className="h-64 flex flex-col">
                  <h4 className="font-medium mb-2">전체 배경 이미지</h4>
                  <p className="text-xs text-gray-500 mb-2">모든 세그먼트에 적용 (9:16 권장)</p>
                  {!globalBackgroundImage ? (
                    <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center flex-1 flex flex-col justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleGlobalBackgroundImageUpload(file);
                        }}
                        className="hidden"
                        id="global-bg-upload-new"
                      />
                      <label htmlFor="global-bg-upload-new" className="cursor-pointer block">
                        <div className="text-orange-400 mb-2 text-2xl">🌅</div>
                        <p className="text-sm text-orange-600">배경 이미지 업로드</p>
                      </label>
                    </div>
                  ) : (
                    <div className="p-4 bg-orange-100 border-2 border-orange-300 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-orange-400 mb-1 text-lg">🌅</div>
                          <p className="text-sm text-orange-600 font-medium">{globalBackgroundImageName}</p>
                        </div>
                        <button
                          onClick={() => {
                            setGlobalBackgroundImage("");
                            setGlobalBackgroundImageName("");
                          }}
                          className="bg-red-500 text-white w-6 h-6 rounded-full text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 통합된 썸네일 미리보기 */}
              {(thumbnailImage || showThumbnailText || globalBackgroundImage) && (
                <div className="mt-6 p-4 bg-white bg-opacity-50 rounded-lg border border-purple-300">
                  <h4 className="font-medium mb-3 text-purple-800">🎯 썸네일 미리보기 및 편집</h4>
                  <p className="text-sm text-purple-600 mb-4">드래그하여 위치를 조정하고 오른쪽 패널에서 스타일을 수정하세요</p>
                  
                  <div className="flex gap-6">
                    {/* 캔버스 크기 미리보기 (1080x1920) */}
                    <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl" style={{ width: '360px', height: '640px' }}>
                      {/* 배경 이미지 또는 검은 배경 */}
                      {globalBackgroundImage ? (
                        <img
                          src={globalBackgroundImage}
                          alt="Background"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-black"></div>
                      )}
                      
                      {/* 썸네일 텍스트 */}
                      {showThumbnailText && (
                        <div
                          className="absolute px-4 py-2 cursor-move select-none max-w-[90%] text-center font-bold"
                          style={{
                            left: `${thumbnailPosition.x}%`,
                            top: `${thumbnailPosition.y}%`,
                            transform: 'translate(-50%, -50%)',
                            color: thumbnailTextColor,
                            fontSize: `${thumbnailTextSize / 2}px`, // 미리보기는 절반 크기
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                            zIndex: 30
                          }}
                          onMouseDown={(e) => {
                            const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                            
                            const handleMouseMove = (e: MouseEvent) => {
                              const x = ((e.clientX - rect.left) / rect.width) * 100;
                              const y = ((e.clientY - rect.top) / rect.height) * 100;
                              setThumbnailPosition({
                                x: Math.max(10, Math.min(90, x)), 
                                y: Math.max(10, Math.min(90, y))
                              });
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        >
                          {thumbnailText}
                        </div>
                      )}

                      {/* 썸네일 이미지 */}
                      {thumbnailImage && (
                        <div
                          className="absolute cursor-move"
                          style={{
                            left: `${thumbnailImagePosition.x}%`,
                            top: `${thumbnailImagePosition.y}%`,
                            transform: `translate(-50%, -50%) scale(${thumbnailImagePosition.scale})`,
                            width: '150px', // 기본 크기 증가 (스케일 적용 고려)
                            height: '100px',
                            zIndex: 25
                          }}
                          onMouseDown={(e) => {
                            const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                            
                            const handleMouseMove = (e: MouseEvent) => {
                              const x = ((e.clientX - rect.left) / rect.width) * 100;
                              const y = ((e.clientY - rect.top) / rect.height) * 100;
                              setThumbnailImagePosition(prev => ({
                                ...prev,
                                x: Math.max(10, Math.min(90, x)), 
                                y: Math.max(10, Math.min(90, y))
                              }));
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        >
                          <img
                            src={thumbnailImage}
                            alt="Thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* 편집 패널 */}
                    <div className="flex-1 bg-gray-50 p-4 rounded-lg max-w-md">
                      <h5 className="font-medium mb-4">🎨 썸네일 편집</h5>
                      
                      {/* 텍스트 옵션 */}
                      {showThumbnailText && (
                        <div className="space-y-4 mb-6 p-3 bg-white rounded border">
                          <h6 className="font-medium text-sm">텍스트 설정</h6>
                          
                          <div>
                            <label className="block text-xs font-medium mb-1">텍스트 내용</label>
                            <textarea
                              value={thumbnailText}
                              onChange={(e) => setThumbnailText(e.target.value)}
                              className="w-full p-2 border rounded text-sm resize-none"
                              rows={2}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium mb-1">크기</label>
                              <input
                                type="range"
                                min="16"
                                max="64"
                                value={thumbnailTextSize}
                                onChange={(e) => updateThumbnailTextSize(parseInt(e.target.value))}
                                className="w-full"
                              />
                              <div className="text-xs text-gray-500 text-center">{thumbnailTextSize}px</div>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium mb-1">색상</label>
                              <input
                                type="color"
                                value={thumbnailTextColor}
                                onChange={(e) => updateThumbnailTextColor(e.target.value)}
                                className="w-full h-8 border rounded"
                              />
                            </div>
                          </div>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <p className="text-xs text-blue-700">
                              🔄 변경 시 모든 세그먼트에 자동 적용됩니다.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* 이미지 옵션 */}
                      {thumbnailImage && (
                        <div className="space-y-4 mb-6 p-3 bg-white rounded border">
                          <h6 className="font-medium text-sm">이미지 설정</h6>
                          
                          <div>
                            <label className="block text-xs font-medium mb-1">크기</label>
                            <input
                              type="range"
                              min="0.5"
                              max="2.0"
                              step="0.1"
                              value={thumbnailImagePosition.scale}
                              onChange={(e) => setThumbnailImagePosition(prev => ({...prev, scale: parseFloat(e.target.value)}))}
                              className="w-full"
                            />
                            <div className="text-xs text-gray-500 text-center">{Math.round(thumbnailImagePosition.scale * 100)}%</div>
                          </div>
                        </div>
                      )}
                      
                      {/* 위치 프리셋 */}
                      <div className="space-y-3">
                        <h6 className="font-medium text-sm">빠른 위치 설정</h6>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setThumbnailPosition({x: 50, y: 20})}
                            className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded hover:bg-purple-200"
                          >
                            상단
                          </button>
                          <button
                            onClick={() => setThumbnailPosition({x: 50, y: 50})}
                            className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded hover:bg-purple-200"
                          >
                            중앙
                          </button>
                          <button
                            onClick={() => setThumbnailPosition({x: 50, y: 80})}
                            className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded hover:bg-purple-200"
                          >
                            하단
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <div className="text-xs text-purple-600 text-center">
                      <p>🎨 오른쪽 패널에서 스타일을 수정하고 드래그하여 위치를 조정하세요</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* 세그먼트 리스트 - 탭 또는 쪼질 형태 */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {segments.map((segment, index) => (
                  <button
                    key={segment.id}
                    onClick={() => setSelectedSegmentId(segment.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedSegmentId === segment.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    세그먼트 {index + 1}
                    {segment.audioUrl && <span className="ml-1 text-green-400">✓</span>}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 선택된 세그먼트 편집 */}
            {selectedSegmentId && segments.find(s => s.id === selectedSegmentId) && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              {(() => {
                const segment = segments.find(s => s.id === selectedSegmentId)!;
                const index = segments.findIndex(s => s.id === selectedSegmentId);
                return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">📹 세그먼트 {index + 1} 편집</h3>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${ 
                        segment.audioUrl ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {segment.audioUrl ? 'TTS 완료' : 'TTS 대기'}
                      </span>
                    </div>
                  </div>
                  
                  {/* 2열 레이아웃: 미리보기 + 편집 패널 */}
                  <div className="grid grid-cols-2 gap-8">
                    {/* 실시간 미리보기 - 캔버스 크기 */}
                    <div>
                      <h4 className="font-medium mb-3">📱 실시간 미리보기</h4>
                      <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl mx-auto" style={{ width: '360px', height: '640px' }}>
                        {/* 배경 이미지 */}
                        {globalBackgroundImage ? (
                          <img
                            src={globalBackgroundImage}
                            alt="Background"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-black"></div>
                        )}
                        
                        {/* 썸네일 텍스트 */}
                        {showThumbnailText && (
                          <div
                            className="absolute px-4 py-2 cursor-move select-none max-w-[90%] text-center font-bold"
                            style={{
                              left: `${thumbnailPosition.x}%`,
                              top: `${thumbnailPosition.y}%`,
                              transform: 'translate(-50%, -50%)',
                              color: thumbnailTextColor,
                              fontSize: `${thumbnailTextSize / 3}px`, // 1080 기준으로 조정
                              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                              zIndex: 30
                            }}
                          >
                            {thumbnailText}
                          </div>
                        )}
                        
                        {/* 세그먼트 이미지 */}
                        {segment.imageUrl && (
                          <div
                            className="absolute cursor-move"
                            style={{
                              left: `${segment.imagePosition?.x || 50}%`,
                              top: `${segment.imagePosition?.y || 50}%`,
                              transform: `translate(-50%, -50%) scale(${segment.imagePosition?.scale || 1})`,
                              width: '150px', // 기본 크기 증가 (스케일 적용 고려)
                              height: '100px',
                              zIndex: 20
                            }}
                            onMouseDown={(e) => {
                              const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                              const handleMouseMove = (e: MouseEvent) => {
                                const x = ((e.clientX - rect.left) / rect.width) * 100;
                                const y = ((e.clientY - rect.top) / rect.height) * 100;
                                setSegments(prev => prev.map(s => 
                                  s.id === segment.id ? { 
                                    ...s, 
                                    imagePosition: {
                                      x: Math.max(10, Math.min(90, x)), 
                                      y: Math.max(10, Math.min(90, y)),
                                      scale: s.imagePosition?.scale || 1
                                    }
                                  } : s
                                ));
                              };
                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };
                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          >
                            <img
                              src={segment.imageUrl}
                              alt="Segment"
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                        )}
                        
                        {/* 세그먼트 자막 */}
                        <div
                          className="absolute px-3 py-2 cursor-move select-none max-w-[90%] text-center font-bold"
                          style={{
                            left: `${segment.subtitlePosition?.x || 50}%`,
                            top: `${segment.subtitlePosition?.y || 75}%`,
                            transform: 'translate(-50%, -50%)',
                            color: segment.textColor || '#ffffff',
                            fontSize: `${(segment.textSize || 24) / 3}px`, // 1080 기준 조정
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                            zIndex: 35
                          }}
                          onMouseDown={(e) => {
                            const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                            const handleMouseMove = (e: MouseEvent) => {
                              const x = ((e.clientX - rect.left) / rect.width) * 100;
                              const y = ((e.clientY - rect.top) / rect.height) * 100;
                              updateSubtitlePosition(segment.id, 
                                Math.max(10, Math.min(90, x)), 
                                Math.max(10, Math.min(90, y))
                              );
                            };
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        >
                          {segment.text}
                        </div>
                      </div>
                    </div>
                    
                    {/* 편집 패널 */}
                    <div className="space-y-6">
                      <h4 className="font-medium">🎨 세그먼트 편집</h4>
                      
                      {/* 텍스트 편집 */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-medium">텍스트 설정</h5>
                          <label className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              checked={applyToAllSegments}
                              onChange={(e) => setApplyToAllSegments(e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-blue-600">🔄 전체 적용</span>
                          </label>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">내용</label>
                            <textarea
                              value={segment.text}
                              onChange={(e) => {
                                setSegments(prev => prev.map(s => 
                                  s.id === segment.id ? { ...s, text: e.target.value } : s
                                ));
                              }}
                              className="w-full p-2 border rounded resize-none"
                              rows={3}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium mb-1">크기</label>
                              <input
                                type="range"
                                min="16"
                                max="48"
                                value={segment.textSize || 24}
                                onChange={(e) => updateTextSize(segment.id, parseInt(e.target.value))}
                                className="w-full"
                              />
                              <div className="text-xs text-gray-500 text-center">{segment.textSize || 24}px</div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">색상</label>
                              <input
                                type="color"
                                value={segment.textColor || '#ffffff'}
                                onChange={(e) => updateTextColor(segment.id, e.target.value)}
                                className="w-full h-8 border rounded"
                              />
                            </div>
                          </div>
                          
                          {applyToAllSegments && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2">
                              <p className="text-xs text-blue-700">
                                ✅ 색상과 크기 변경이 모든 세그먼트에 적용됩니다.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 이미지 편집 */}
                      {segment.imageUrl && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium mb-3">이미지 설정</h5>
                          <div>
                            <label className="block text-sm font-medium mb-1">크기</label>
                            <input
                              type="range"
                              min="0.5"
                              max="2.0"
                              step="0.1"
                              value={segment.imagePosition?.scale || 1}
                              onChange={(e) => setSegments(prev => prev.map(s => 
                                s.id === segment.id ? { 
                                  ...s, 
                                  imagePosition: {
                                    ...s.imagePosition,
                                    x: s.imagePosition?.x || 50,
                                    y: s.imagePosition?.y || 50,
                                    scale: parseFloat(e.target.value)
                                  }
                                } : s
                              ))}
                              className="w-full"
                            />
                            <div className="text-xs text-gray-500 text-center">{Math.round((segment.imagePosition?.scale || 1) * 100)}%</div>
                          </div>
                        </div>
                      )}
                      
                      {/* 위치 프리셋 */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium mb-3">빠른 위치 설정</h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-2">자막 위치</label>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => updateSubtitlePosition(segment.id, 50, 20)}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200"
                              >
                                상단
                              </button>
                              <button
                                onClick={() => updateSubtitlePosition(segment.id, 50, 50)}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200"
                              >
                                중앙
                              </button>
                              <button
                                onClick={() => updateSubtitlePosition(segment.id, 50, 80)}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200"
                              >
                                하단
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })()}
            </div>
            )}
            
            {/* 기존 세그먼트들은 숨김 처리하고 선택된 것만 표시 */}
            <div style={{ display: 'none' }}>
              {segments.map((segment, index) => {
                return (
                <div 
                  key={segment.id} 
                  className="border-2 border-gray-200 rounded-lg p-4"
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', index.toString());
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    if (fromIndex !== index) {
                      moveSegment(fromIndex, index);
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <div className="cursor-move text-gray-400 hover:text-gray-600 text-lg">
                        ⋮⋮
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-lg">
                            📹 세그먼트 {segment.order || index + 1}
                          </h3>
                          
                          {/* 순서 변경 버튼 */}
                          <div className="flex gap-1">
                            {index > 0 && (
                              <button
                                onClick={() => moveSegment(index, index - 1)}
                                className="w-8 h-8 flex items-center justify-center bg-blue-100 hover:bg-blue-200 rounded-full text-sm font-bold text-blue-600"
                                title="위로 이동"
                                disabled={index === 0}
                              >
                                ↑
                              </button>
                            )}
                            {index < segments.length - 1 && (
                              <button
                                onClick={() => moveSegment(index, index + 1)}
                                className="w-8 h-8 flex items-center justify-center bg-blue-100 hover:bg-blue-200 rounded-full text-sm font-bold text-blue-600"
                                title="아래로 이동"
                                disabled={index === segments.length - 1}
                              >
                                ↓
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* 자막 수정 가능한 입력 필드 */}
                        <div className="mt-2">
                          <textarea
                            value={pendingTextChanges[segment.id] !== undefined ? pendingTextChanges[segment.id] : segment.text}
                            onChange={(e) => {
                              const newText = e.target.value;
                              setPendingTextChanges(prev => ({
                                ...prev,
                                [segment.id]: newText
                              }));
                            }}
                            className="w-full text-sm p-2 border border-gray-300 rounded resize-none"
                            rows={2}
                            placeholder="자막 텍스트 입력..."
                          />
                          
                          {/* 변경 확인 버튼 */}
                          {pendingTextChanges[segment.id] !== undefined && pendingTextChanges[segment.id] !== segment.text && (
                            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span className="text-sm text-yellow-700 font-medium">자막 변경 확인</span>
                              </div>
                              <p className="text-xs text-yellow-600 mb-3">
                                ⚠️ 자막을 변경하시겠습니까? 변경 후 TTS 파일을 재생성해야 합니다.
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => confirmTextChange(segment.id)}
                                  className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                                >
                                  변경하기
                                </button>
                                <button
                                  onClick={() => {
                                    setPendingTextChanges(prev => {
                                      const newPending = { ...prev };
                                      delete newPending[segment.id];
                                      return newPending;
                                    });
                                  }}
                                  className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {segment.text && segment.audioUrl === undefined && pendingTextChanges[segment.id] === undefined && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <span className="text-xs text-orange-600">텍스트 수정됨 - TTS 재생성 필요</span>
                            </div>
                          )}
                        </div>
                        
                        {segment.audioUrl && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600">음성 생성 완료</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* 메인 이미지 업로드 */}
                    <div>
                      <h4 className="font-medium mb-2">메인 이미지</h4>
                      <p className="text-xs text-gray-500 mb-2">영상 중앙에 표시될 이미지</p>
                      {!segment.imageUrl ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(segment.id, file);
                            }}
                            className="hidden"
                            id={`image-upload-${segment.id}`}
                          />
                          <label
                            htmlFor={`image-upload-${segment.id}`}
                            className="cursor-pointer block"
                          >
                            <div className="text-gray-400 mb-2">📷</div>
                            <p className="text-xs text-gray-600">메인 이미지 업로드</p>
                          </label>
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-100 border-2 border-gray-300 rounded">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-gray-400 mb-1">📷</div>
                              <p className="text-xs text-gray-600 font-medium">{segment.imageName}</p>
                            </div>
                            <button
                              onClick={() => {
                                setSegments(prev => prev.map(s => 
                                  s.id === segment.id ? { ...s, imageUrl: undefined, imageName: undefined } : s
                                ));
                              }}
                              className="bg-red-500 text-white w-5 h-5 rounded-full text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )}
                    </div>


                    {/* 한국형 Shorts 미리보기 */}
                    {(segment.imageUrl || globalBackgroundImage || showThumbnailText) && (
                      <div>
                        <h4 className="font-medium mb-2 text-lg">📱 실시간 Shorts 미리보기</h4>
                        <p className="text-xs text-gray-500 mb-3">썸네일 텍스트 + 세그먼트 이미지 + 자막 최종 미리보기</p>
                        
                        <div className="relative bg-black rounded-lg overflow-hidden mx-auto shadow-2xl" style={{ aspectRatio: '9/16', height: '350px' }}>
                          {/* 배경 이미지 또는 검은 배경 */}
                          {globalBackgroundImage ? (
                            <img
                              src={globalBackgroundImage}
                              alt="Background"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-black"></div>
                          )}
                          
                          {/* 썸네일 텍스트 (전체 세그먼트에 표시) */}
                          {showThumbnailText && (
                            <div
                              className="absolute px-4 py-2 cursor-move select-none max-w-[90%] text-center font-bold"
                              style={{
                                left: `${thumbnailPosition.x}%`,
                                top: `${thumbnailPosition.y}%`,
                                transform: 'translate(-50%, -50%)',
                                color: thumbnailTextColor,
                                fontSize: `${thumbnailTextSize * 0.7}px`, // 세그먼트 미리보기는 70% 크기
                                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                zIndex: 30
                              }}
                              onMouseDown={(e) => {
                                const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                                
                                const handleMouseMove = (e: MouseEvent) => {
                                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                                  setThumbnailPosition({
                                    x: Math.max(10, Math.min(90, x)), 
                                    y: Math.max(10, Math.min(90, y))
                                  });
                                };
                                
                                const handleMouseUp = () => {
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };
                                
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                            >
                              {thumbnailText}
                            </div>
                          )}

                          
                          {/* 세그먼트 메인 이미지 (자유 이동 가능) */}
                          {segment.imageUrl && (
                            <div
                              className="absolute cursor-move"
                              style={{
                                left: `${segment.imagePosition?.x || 50}%`,
                                top: `${segment.imagePosition?.y || 50}%`,
                                transform: `translate(-50%, -50%) scale(${segment.imagePosition?.scale || 1})`,
                                width: '150px',
                                height: '100px',
                                zIndex: 20
                              }}
                              onMouseDown={(e) => {
                                const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                                
                                const handleMouseMove = (e: MouseEvent) => {
                                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                                  setSegments(prev => prev.map(s => 
                                    s.id === segment.id ? { 
                                      ...s, 
                                      imagePosition: {
                                        x: Math.max(10, Math.min(90, x)), 
                                        y: Math.max(10, Math.min(90, y)),
                                        scale: s.imagePosition?.scale || 1
                                      }
                                    } : s
                                  ));
                                };
                                
                                const handleMouseUp = () => {
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };
                                
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                            >
                              <img
                                src={segment.imageUrl}
                                alt="Segment"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          {/* 세그먼트 자막 */}
                          <div
                            className="absolute text-white px-3 py-2 text-sm cursor-move select-none max-w-[90%] text-center font-bold"
                            style={{
                              left: `${segment.subtitlePosition?.x || 50}%`,
                              top: `${segment.subtitlePosition?.y || 75}%`,
                              transform: 'translate(-50%, -50%)',
                              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                              zIndex: 35
                            }}
                            onMouseDown={(e) => {
                              const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                              
                              const handleMouseMove = (e: MouseEvent) => {
                                const x = ((e.clientX - rect.left) / rect.width) * 100;
                                const y = ((e.clientY - rect.top) / rect.height) * 100;
                                updateSubtitlePosition(segment.id, 
                                  Math.max(10, Math.min(90, x)), 
                                  Math.max(10, Math.min(90, y))
                                );
                              };
                              
                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };
                              
                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          >
                            {segment.text}
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          <div className="text-xs text-gray-600 space-y-1">
                            <p><span className="inline-block w-3 h-3 bg-purple-400 rounded mr-2"></span>썸네일 텍스트 (모든 세그먼트에 표시)</p>
                            <p><span className="inline-block w-3 h-3 bg-blue-400 rounded mr-2"></span>세그먼트 이미지 (드래그로 이동 가능)</p>
                            <p><span className="inline-block w-3 h-3 bg-green-400 rounded mr-2"></span>세그먼트 자막 (드래그로 이동 가능)</p>
                            <p className="text-purple-600">💡 썸네일 이미지는 별도 썸네일 전용으로만 사용</p>
                          </div>
                          
                          {/* 위치 프리셋 */}
                          <div className="flex gap-2 flex-wrap">
                            <span className="text-xs font-medium">자막 위치:</span>
                            <button
                              onClick={() => updateSubtitlePosition(segment.id, 50, 20)}
                              className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded hover:bg-green-200"
                            >
                              상단
                            </button>
                            <button
                              onClick={() => updateSubtitlePosition(segment.id, 50, 50)}
                              className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded hover:bg-green-200"
                            >
                              중앙
                            </button>
                            <button
                              onClick={() => updateSubtitlePosition(segment.id, 50, 80)}
                              className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded hover:bg-green-200"
                            >
                              하단
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <button 
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                이전 단계
              </button>
              
              <button 
                onClick={() => {
                  setCurrentStep(4);
                  // 잠시 후 비디오 생성 시작
                  setTimeout(() => generateVideo(), 100);
                }}
                disabled={isGeneratingVideo || !segments.every(s => s.audioUrl && (s.imageUrl || globalBackgroundImage))}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
              >
                {isGeneratingVideo ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    비디오 생성 중...
                  </div>
                ) : (
                  "🎬 비디오 생성하기"
                )}
              </button>
            </div>
          </div>
        )}

        {/* 비디오 결과 섹션 */}
        {/* 4단계: 비디오 생성 */}
        {currentStep === 4 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">4. 비디오 생성</h2>
            
            <div className="text-center">
              <button 
                onClick={generateVideo}
                disabled={isGeneratingVideo || !segments.every(s => s.audioUrl && (s.imageUrl || globalBackgroundImage))}
                className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium text-lg"
              >
                {isGeneratingVideo ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    비디오 생성 중...
                  </div>
                ) : (
                  "🎬 비디오 생성하기"
                )}
              </button>
            </div>
            
            <div className="mt-6 flex justify-start">
              <button 
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                이전 단계
              </button>
            </div>
          </div>
        )}

        {/* 비디오 결과 섹션 */}
        {videoResult && currentStep === 4 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🎉 비디오 생성 완료!</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* 비디오 플레이어 */}
              <div>
                <h3 className="font-medium mb-3">📹 생성된 비디오</h3>
                <div className="relative bg-black rounded-lg overflow-hidden shadow-lg" style={{ aspectRatio: '9/16', height: '400px' }}>
                  <video
                    src={videoResult}
                    controls
                    className="w-full h-full"
                    preload="metadata"
                    onLoadedMetadata={(e) => {
                      const video = e.target as HTMLVideoElement;
                      console.log("비디오 길이:", video.duration + "초");
                      // 총 시간 표시 업데이트 (NaN 방지)
                      const totalTimeElement = document.getElementById('video-total-time');
                      if (totalTimeElement && !isNaN(video.duration) && isFinite(video.duration)) {
                        const minutes = Math.floor(video.duration / 60);
                        const seconds = Math.floor(video.duration % 60);
                        totalTimeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                      } else if (totalTimeElement) {
                        // 총 길이 계산: 썸네일 초 + 세그먼트별 TTS 초
                        const totalDuration = thumbnailDuration + segments.reduce((acc, s) => acc + (s.audioDuration || 2), 0);
                        const minutes = Math.floor(totalDuration / 60);
                        const seconds = Math.floor(totalDuration % 60);
                        totalTimeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                        console.log('총 길이 계산:', {
                          thumbnailDuration,
                          segmentCount: segments.length,
                          totalDuration
                        });
                      }
                    }}
                    onTimeUpdate={(e) => {
                      const video = e.target as HTMLVideoElement;
                      // 현재 시간 업데이트 (NaN 방지)
                      const currentTimeElement = document.getElementById('video-current-time');
                      if (currentTimeElement && !isNaN(video.currentTime) && isFinite(video.currentTime)) {
                        const minutes = Math.floor(video.currentTime / 60);
                        const seconds = Math.floor(video.currentTime % 60);
                        currentTimeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                      }
                    }}
                  >
                    브라우저에서 비디오를 지원하지 않습니다.
                  </video>
                  
                  {/* 간단한 시간 표시 */}
                  <div className="absolute top-2 right-12 text-white text-xs">
                    <span id="video-current-time">0:00</span> / <span id="video-total-time">
                      {(() => {
                        const totalDuration = thumbnailDuration + segments.reduce((acc, s) => acc + (s.audioDuration || 2), 0);
                        const minutes = Math.floor(totalDuration / 60);
                        const seconds = Math.floor(totalDuration % 60);
                        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                      })()} 
                    </span>
                  </div>
                  
                </div>
              </div>

              {/* 비디오 정보 및 다운로드 */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3">📊 비디오 정보</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">썸네일 지속시간:</span>
                      <span className="font-medium">{thumbnailDuration}초</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">세그먼트 수:</span>
                      <span className="font-medium">{segments.length}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">총 길이:</span>
                      <span className="font-medium">
                        {Math.round((thumbnailDuration + segments.reduce((acc, s) => acc + (s.audioDuration || 2), 0)) * 10) / 10}초
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">해상도:</span>
                      <span className="font-medium">9:16 (Shorts 최적화)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">📁 다운로드 및 공유</h3>
                  <div className="space-y-3">
                    <a
                      href={videoResult}
                      download="youtube-shorts-video.mp4"
                      className="block w-full px-4 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 font-medium"
                    >
                      📥 비디오 다운로드
                    </a>
                    
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(videoResult);
                        alert("비디오 링크가 클립보드에 복사되었습니다!");
                      }}
                      className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                    >
                      🔗 링크 복사
                    </button>

                    <button
                      onClick={() => {
                        setVideoResult("");
                        setIsGeneratingVideo(false);
                        setCurrentStep(1);
                        setShowSegments(false);
                        setShowImageUpload(false);
                      }}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      🔄 새 비디오 만들기
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="font-medium text-yellow-800 mb-1">💡 팁</h4>
                  <p className="text-sm text-yellow-700">
                    생성된 비디오는 YouTube Shorts에 최적화되어 있습니다. 
                    직접 업로드하거나 추가 편집 소프트웨어에서 사용할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}