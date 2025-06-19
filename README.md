## Judot-Next: 돚하이 하이라이트 클립 아카이브 (Frontend)

-----

### 🔗 **서비스 링크**: [judot-next.vercel.app/main](https://judot-next.vercel.app/main)

### 🖥️ **메인 화면**

### 1\. 프로젝트 개요

네이버 카페의 영상 게시물을 수집하는 백엔드 시스템과 연동하여, 사용자가 VOD 클립을 편리하게 시청할 수 있도록 웹 페이지를 제공하는 프론트엔드 프로젝트입니다.

Firebase Firestore DB에 저장된 데이터를 직접 호출하여 날짜별로 필터링 및 페이징하여 보여줍니다.

### 2\. 주요 기능

  * **VOD 아카이브 조회**: Firestore에 저장된 영상 데이터를 날짜별로 페이징하여 표시합니다.
  * **멤버별 필터링**: 특정 멤버의 영상만 모아볼 수 있는 필터링 기능을 제공합니다.
  * **반응형 UI**: 웹/모바일 환경에 대응하는 UI를 제공합니다.

### 3\. 기술 스택 (Tech Stack)

  * **Framework**: Next.js
  * **Deployment**: Vercel
  * **Database**: Firebase Firestore
  * **AI Assistants**: Claude, ChatGPT

### 4\. 주요 개발 및 개선사항

  * **데이터 연동**: Firebase Firestore DB의 데이터를 직접 호출하여 사용자에게 실시간으로 제공합니다.
  * **UI/UX 개선**:
      * 사용자가 클릭할 수 있는 모든 요소에 마우스 커서 모양(`pointer`)을 적용하여 직관적인 상호작용이 가능하도록 개선했습니다.
      * **(실패 경험)** SOOP VOD 플레이어 내 '추천영상' 버튼 제거를 시도했으나, 브라우저의 CORS(Cross-Origin Resource Sharing) 정책으로 인해 `iframe` 내부 콘텐츠 조작이 불가능함을 확인했습니다.

### 5\. 향후 개선 계획

  * **TypeScript 전환**: 코드 안정성과 유지보수성 향상을 위해 프로젝트를 TypeScript로 전환할 계획입니다.
