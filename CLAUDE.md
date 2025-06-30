## Elevator Pitch

Create viral YouTube Shorts effortlessly. Just enter a topic—our AI handles scriptwriting, voiceovers, visuals, and video editing.

## Problem & Mission

**Problem:** Creators struggle with the repetitive, time-consuming process of writing, voicing, and editing Shorts.
**Mission:** Automate the full Shorts creation workflow so users can go from idea to finished video in minutes.

## Target Audience

* Solo content creators
* Aspiring YouTubers
* Educators and marketers using short-form video

## Core Features

* Script generation via OpenAI API
* Flexible script segmentation (user-defined)
* TTS audio generation with preview and regeneration
* Per-segment image uploads + full video background
* Automatic video assembly from audio + visuals

## High-Level Tech Stack

* **Frontend:** React (dynamic, responsive UI)
* **Backend:** FastAPI (modular, TTS-ready)
* **AI:** OpenAI API (script writing)
* **Media Processing:** FFmpeg (video assembly)
* **Storage:** AWS S3 or Firebase (media files)

## Conceptual Data Model (ERD Sketch in Words)

* **User**: id, email, preferences
* **Project**: id, user\_id, title, created\_at
* **Script**: id, project\_id, full\_text, segments\[]
* **Segment**: id, script\_id, text, tts\_audio\_url, image\_url
* **Video**: id, project\_id, video\_url, status

## UI Design Principles

* Minimize friction ("Don’t Make Me Think")
* Use visual progress indicators for steps
* Drag-and-drop and inline previews
* CTA buttons must be large, clear, and descriptive

## Security & Compliance

* OAuth for login
* Limit file upload size and sanitize file types
* Store files securely (S3 signed URLs or Firebase rules)

## Phased Roadmap

**MVP**

* Script input → auto-generate → user splits → TTS preview + photo upload → final video render

**V1**

* Script library, template suggestions
* Basic analytics (views, click-throughs)

**V2**

* Background music + auto captions
* Export to TikTok, Instagram Reels
* Community sharing gallery

## Risks & Mitigations

* **AI script quality low** → Allow full user edit, use prompt tuning
* **TTS robotic tone** → Offer regeneration, allow voice style selection
* **Image mismatch** → Add sample image hints per script

## Future Expansion Ideas

* AI-based image suggestion
* Real human voiceovers via API
* Team collaboration mode

## Step-by-Step Build Sequence

1. User auth system (OAuth)
2. Input UI for script topic or manual entry
3. Integrate OpenAI for auto-script generation
4. UI for previewing/editing full script
5. Script splitter UI with draggable segments
6. Backend routes for segment save/update
7. Connect TTS FastAPI endpoint per segment
8. Audio preview player + re-generate button
9. Image upload input per segment
10. Full background image upload
11. FFmpeg pipeline to combine TTS + images → video
12. Video player + download/export UI

## Timeline with Checkpoints

**Week 1–2:** Auth + script editor + OpenAI
**Week 3–4:** Segmenter + TTS + audio preview
**Week 5:** Image upload + FFmpeg pipeline
**Week 6:** Final video render UI + polish

## Team Roles & Rituals

* **PM/Founder:** Scope, feedback, UX sanity check
* **Frontend Dev:** UI/UX for script, preview, upload
* **Backend Dev:** API integrations, FFmpeg ops
* **Weekly check-in:** Demo + blocker unblocking
* **Bi-weekly test:** 3-user guerrilla usability test

## Optional Integrations & Stretch Goals

* Background music generation (Boomy or similar)
* One-click publish to YouTube
* AI voice emotion tuning

## Brand Voice & Tone

* Friendly, empowering, and no-jargon
* "Let the tool do the work" mindset
* Keep text actionable and brief

## Color, Typography, Spacing

* High-contrast neutrals (dark on light)
* Accent color for CTAs (e.g., vivid blue or coral)
* Sans-serif font (e.g., Inter, 16px+)
* Plenty of padding around previews/forms

## Layout Best Practices

* Mobile-first with adaptive columns
* Step-by-step layout: Script → Split → TTS → Upload → Export
* Use cards and modals for focus

## Accessibility Must-Dos

* All buttons labeled, keyboard accessible
* Alt text on uploaded images
* Focus outlines and ARIA roles for all custom components

## Content Style Guide

* Headings: Sentence case, concise
* Bullets: Action-first ("Upload image", "Preview voice")
* Links: Descriptive labels ("Download your video", not "Click here")

## Site Map

* Home (Landing)
* Create New Project
* Script Editor
* Segment + TTS
* Image Upload
* Video Preview + Export
* My Projects (Dashboard)

## Purpose of Each Page

* **Home:** Introduce product and login
* **Create New Project:** Input title + script
* **Script Editor:** Edit AI-generated or manual script
* **Segment + TTS:** Split script, listen to TTS previews
* **Image Upload:** Upload images per segment + background
* **Video Preview + Export:** Render and download final video
* **My Projects:** List and manage saved videos

## User Roles and Access Levels

* **Guest:** View landing, must login to create
* **User:** Full access to creation tools, project saving
* **Admin:** Moderate content, view usage stats

## Primary User Journeys

1. **Idea → Script → Video**

   * Enter topic → Generate script → Split + voice → Upload images → Export

2. **Edit Existing Project**

   * Go to My Projects → Select → Re-record or change images → Re-export

3. **Test Voice Before Commit**

   * Split script → TTS preview → Regenerate if needed → Proceed to image upload

### 꼭 숙지 할 것
- 기능을 추가할 땐 테스트를 먼저 만드는 TDD 방식으로 개발해줘.
- 코드를 짜고 나면, rail test 명령을 통해 테스트가 잘 성공하는지 반드시 확인하도록 해.
- test 코드를 추가할 땐 minitest를 사용해. Rspec은 쓰지마, fixtures를 추가할 땐 내게 물어보고 추가해.

✅ 개요 및 목적

사용자가 입력한 주제 또는 스크립트를 바탕으로 자동으로 유튜브 쇼츠를 생성하는 올인원 툴.

핵심 목표: "아이디어 입력 → 쇼츠 완성"까지 모든 단계를 자동화.

🧩 전체 기능 흐름

스크립트 입력

사용자가 주제나 직접 작성한 문장을 입력

OpenAI API를 통해 대본 자동 생성

스크립트 분할

유저가 문단 또는 문장을 기준으로 직접 분할 조정

각 토막은 개별 TTS 처리 단위가 됨

TTS 생성 및 미리듣기

FastAPI로 감싼 TTS 서버에 요청

각 문장별 음성 생성 + 미리듣기 제공

마음에 안 들면 재생성 가능

이미지 업로드

각 토막별로 배경 이미지 업로드

영상 전체에 적용될 기본 배경 이미지도 업로드 가능

영상 렌더링

FFmpeg로 음성과 이미지를 결합

최종 쇼츠 영상 완성 및 다운로드

🧪 기술 스택

Frontend: React (Next.js 고려 가능)

Backend: FastAPI (TTS 연동 포함)

AI API: OpenAI (script generation)

Media: FFmpeg (영상 합성), AudioPlayer API (프리뷰)

Storage: Firebase Storage 또는 AWS S3

Auth: OAuth (Google 로그인)

📄 페이지 구조

Home: 소개 및 로그인

Create Project: 주제 입력 및 대본 생성

Script Editor: 대본 수정 및 분할

TTS & Image: 음성 미리듣기 + 이미지 업로드

Final Render: 영상 미리보기 및 다운로드

My Projects: 저장된 영상 관리

Settings: 사용자 프로필 및 기본 설정

🧵 데이터 흐름 요약

User → Project → Script → Segments (각 segment에 audio_url + image_url)

최종적으로 Segments + 배경 → Video 파일

각 Video는 export 상태, 파일 경로, 생성 시간 포함

🚀 개발 단계 요약

1단계: 구조 기획 및 문서화

전체 플로우 및 기능 범위 정의 (완료)

2단계: MVP 개발

사용자 인증

Script 입력 + OpenAI 연동

Script 분할 UI 및 저장

FastAPI TTS 호출 및 프리뷰

이미지 업로드 UI

FFmpeg 영상 조합 백엔드

프로젝트 저장 및 불러오기

3단계: 기능 고도화

TTS 음성 스타일 선택, 감정 조절

배경음악 추가 옵션

영상 자막 자동 삽입

템플릿 기능 및 저장소 기능

사용자별 프로젝트 대시보드

4단계: 퍼블리싱 및 배포

Export to Shorts/Reels

커뮤니티 공유 기능

사용 분석 대시보드

튜토리얼 및 온보딩 가이드

📌 향후 고려 사항

자동 이미지 추천 (script context 기반)

AI 기반 영상 스타일링 추천

사용자 협업 모드 (공동 편집)

유료 플랜 및 저장 용량 제한

