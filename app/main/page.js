'use client';
// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from './page.module.css';
import { db } from "../lib/firebaseConfig"; // Firebase 설정 파일에서 db 가져오기
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import WeeklyFilter from '../component/WeeklyFilter'; // WeeklyFilter 컴포넌트 가져오기

export default function Main() {

  const [data, setData] = useState([]);
  const [originData, setOriginData] = useState([]);
  const [mem, setMem] = useState([]); // 배열로 변경
  const [weeklyStats, setWeeklyStats] = useState({}); // 주간 통계 상태 추가
  const [groupedData, setGroupedData] = useState({}); // 멤버별로 그룹화된 데이터
  
  // 초기값 설정 - 현재 주의 시작일과 끝일
const [weekRangeFilter, setWeekRangeFilter] = useState(() => {
  const now = new Date();
  const day = now.getDay(); // 0(일) ~ 6(토)
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + mondayOffset); // 월요일

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // 일요일

  const formatDate = (date) => date.toISOString().split('T')[0];

  return {
    start: formatDate(startOfWeek), // yyyy-MM-dd
    end: formatDate(endOfWeek)
  };
});

  const [isDarkMode, setIsDarkMode] = useState(false);

  // 멤버 리스트 정의
  const memberList = ["아이네", "부가땅", "릴파", "고세구", "비챤"];

  // 주간 통계 계산 함수
  const calculateWeeklyStats = (dataToAnalyze) => {
    const stats = {
      total: dataToAnalyze.length,
      members: {}
    };

    // 각 멤버별 카운트 초기화
    memberList.forEach(member => {
      stats.members[member] = 0;
    });

    // 데이터를 순회하며 각 멤버별 카운트
    dataToAnalyze.forEach(item => {
      memberList.forEach(member => {
        if (item.text && item.text.includes(member)) {
          stats.members[member]++;
        }
      });
    });

    return stats;
  };

  // 멤버별로 데이터 그룹화하는 함수
  const groupDataByMember = (dataToGroup) => {
    const grouped = {};
    
    memberList.forEach(member => {
      const memberVideos = dataToGroup.filter(item => 
        item.text && item.text.includes(member)
      );
      
      if (memberVideos.length > 0) {
        grouped[member] = memberVideos;
      }
    });
    
    return grouped;
  };

  // 멤버 토글 함수
  const toggleMember = (memberName) => {
    setMem(prevMem => {
      if (prevMem.includes(memberName)) {
        // 이미 있으면 제거
        return prevMem.filter(name => name !== memberName);
      } else {
        // 없으면 추가
        return [...prevMem, memberName];
      }
    });
  };

  // 전체 선택 함수
  const selectAll = () => {
    setMem([]);
  };

  const handleWeekChange = (weekRange) => {
    setWeekRangeFilter(weekRange);
  };

  // 다크모드 상태를 localStorage에 저장하고 불러오기
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // 시스템 테마 감지
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Firebase에서 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(query(collection(db, "scraped_links"),orderBy("uploadedDate", "asc")));
      
      const docs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).map(doc => ({iframeUrl: `${doc.href}/embed?autoPlay=false&amp;mutePlay=false&amp;showChat=false`, ...doc}));
      setOriginData(docs);
    };
    fetchData();
  }, []);

  // 필터링 로직과 주간 통계 계산을 통합한 useEffect
  useEffect(() => {
    console.log("originData"+originData);
    // originData가 없으면 아직 로딩 중이므로 필터링하지 않음
    if (originData.length === 0) {
      return;
    }

    let result = originData;

    // 주간 필터링 먼저 적용 (통계 계산을 위해)
    let weeklyFilteredData = result;
    if (weekRangeFilter.start && weekRangeFilter.end) {
      console.log("weekRangeFilter.start", weekRangeFilter.start);
      console.log("weekRangeFilter.end", weekRangeFilter.end);
      weeklyFilteredData = result.filter(item => 
        item.uploadedDate >= weekRangeFilter.start && 
        item.uploadedDate <= weekRangeFilter.end
      );
    }

    // 주간 통계 계산 (멤버 필터링 전 데이터로)
    const stats = calculateWeeklyStats(weeklyFilteredData);
    setWeeklyStats(stats);

    // 멤버 필터링 적용
    if (mem.length > 0) {
      weeklyFilteredData = weeklyFilteredData.filter(item => 
        mem.some(memberName => item.text.includes(memberName))
      );
    }

    setData(weeklyFilteredData);
    
    // 멤버별로 데이터 그룹화
    const grouped = groupDataByMember(weeklyFilteredData);
    setGroupedData(grouped);
  }, [originData, mem, weekRangeFilter]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };  

  return (
    <>
      <Head>
        <title>돚하이</title>
        <meta name="description" content="돚하돚하이" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Pretendard:wght@100;200;300;400;500;600;700;800;900&family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" 
          rel="stylesheet" 
        />
      </Head>
      <div className={`${styles.container} ${styles.fontOptimized} ${isDarkMode ? styles.darkMode : styles.lightMode}`}>
        {/* Header */}
        <header className={`${styles.header} ${isDarkMode ? styles.headerDark : styles.headerLight}`}>
          <div className={styles.headerContainer}>
            <div className={styles.headerContent}>
              {/* Logo */}
              <div className={styles.logoContainer}>
                <div className={`${styles.logo} ${styles.logoFont}`}>
                  돚하이
                </div>
              </div>

              {/* Navigation */}
              <nav className={styles.navigation}>
                <button 
                  className={`${styles.navButton} ${styles.koreanFont} ${
                    mem.length === 0 ? styles.navButtonActive : ''
                  }`} 
                  onClick={selectAll}>
                  전체
                </button>
                <button 
                  className={`${styles.navButton} ${styles.koreanFont} ${
                    mem.includes("아이네") ? styles.navButtonIne : ''
                  }`} 
                  onClick={() => toggleMember("아이네")}>
                  아이네
                </button>
                <button 
                  className={`${styles.navButton} ${styles.koreanFont} ${
                    mem.includes("부가땅") ? styles.navButtonBugat : ''
                  }`} 
                  onClick={() => toggleMember("부가땅")}>
                  징버거
                </button>
                <button 
                  className={`${styles.navButton} ${styles.koreanFont} ${
                    mem.includes("릴파") ? styles.navButtonLilpa : ''
                  }`} 
                  onClick={() => toggleMember("릴파")}>
                  릴파
                </button>
                <button 
                  className={`${styles.navButton} ${styles.koreanFont} ${
                    mem.includes("고세구") ? styles.navButtonGosegu : ''
                  }`} 
                  onClick={() => toggleMember("고세구")}>
                  고세구
                </button>
                <button 
                  className={`${styles.navButton} ${styles.koreanFont} ${
                    mem.includes("비챤") ? styles.navButtonVIichan : ''
                  }`} 
                  onClick={() => toggleMember("비챤")}>
                  비챤
                </button>
              </nav>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`${styles.toggleButton} ${isDarkMode ? styles.toggleButtonDark : styles.toggleButtonLight}`}
                aria-label="다크모드 토글"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Hero Section */}
          <div className={styles.heroSection}>
            <h1 className={styles.heroTitleContainer}>
              🎀<span className={`${styles.heroTitle} ${styles.heroFont}`}>돚하이 자동 수집기</span>🎀
            </h1>
            <WeeklyFilter 
              className={`${styles.koreanFont} ${styles.weeklyFilterText} ${isDarkMode ? styles.weeklyFilterTextDark : styles.weeklyFilterTextLight}`} 
              onWeekChange={handleWeekChange} 
              initialWeekRange={weekRangeFilter}
            />
          </div>

          {/* 주간 통계 섹션 */}
          <div className={`${styles.weeklyStatsSection} ${isDarkMode ? styles.weeklyStatsSectionDark : styles.weeklyStatsSectionLight}`}>
            <h2 className={`${styles.koreanFont} ${styles.weeklyStatsTitle} ${isDarkMode ? styles.weeklyStatsTitleDark : styles.weeklyStatsTitleLight}`}>
              📊 주간 통계
            </h2>
            <div className={styles.statsGrid}>
              <div className={`${styles.statCard} ${isDarkMode ? styles.statCardDark : styles.statCardLight}`}>
                <div className={`${styles.koreanFont} ${styles.statLabel} ${isDarkMode ? styles.statLabelDark : styles.statLabelLight}`}>
                  전체
                </div>
                <div className={`${styles.statValue} ${styles.statValueTotal}`}>
                  {weeklyStats.total || 0}
                </div>
              </div>
              
              {memberList.map(member => (
                <div key={member} className={`${styles.statCard} ${isDarkMode ? styles.statCardDark : styles.statCardLight}`}>
                  <div className={`${styles.koreanFont} ${styles.statLabel} ${isDarkMode ? styles.statLabelDark : styles.statLabelLight}`}>
                    {member === "부가땅" ? "징버거" : member}
                  </div>
                  <div className={`${styles.statValue} ${styles[`statValue${member}`]}`}>
                    {weeklyStats.members?.[member] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
{/* Grouped Video Sections */}
<div className={styles.groupedVideoSections}>
  {memberList.map(member => {
    const memberVideos = groupedData[member];
    if (!memberVideos || memberVideos.length === 0) return null;
    
    return (
      <div key={member} className={styles.memberSection}>
        {/* Member Header */}
        <div className={`${styles.memberHeader} ${styles[`memberHeader${member}`]} ${isDarkMode ? styles.memberHeaderDark : styles.memberHeaderLight}`}>
          <h3 className={`${styles.koreanFont} ${styles.memberHeaderTitle} ${styles[`memberHeaderTitle${member}`]} ${isDarkMode ? styles.memberHeaderTitleDark : styles.memberHeaderTitleLight}`}>
            {member === "부가땅" ? "징버거" : member} ({memberVideos.length})
          </h3>
        </div>
        
        {/* Video Grid for this member */}
        <div className={styles.videoGrid}>
          {memberVideos.map((video) => (
            <div
              key={video.id}
              className={`${styles.videoCard} ${isDarkMode ? styles.videoCardDark : styles.videoCardLight}`}
            >
              {/* Iframe Container */}
              <div className={styles.iframeContainer}>
                <iframe
                  src={video.iframeUrl}
                  title={video.title}
                  className={styles.videoIframe}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              
              {/* Video Info */}
              <div className={styles.videoInfo}>
                <h3 className={`${styles.videoTitle} ${styles.koreanFont}`}>
                  {video.title}
                </h3>
                <div className={styles.videoMeta}>
                  <span className={`${styles.koreanFont} ${styles.videoMetaText} ${isDarkMode ? styles.videoMetaTextDark : styles.videoMetaTextLight}`}>
                    {video.title}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  })}
</div>
        </main>

        {/* Footer */}
        <footer className={`${styles.footer} ${isDarkMode ? styles.footerDark : styles.footerLight}`}>
          <div className={styles.footerContainer}>
            <div className={styles.footerContent}>
              <div className={styles.footerMain}>
                <div className={`${styles.logoFont} ${styles.footerLogo}`}>
                  돚하이 자동 수집기
                </div>
                <p className={`${styles.koreanFont} ${styles.footerDescription} ${isDarkMode ? styles.footerDescriptionDark : styles.footerDescriptionLight}`}>
                  돚하이 자동 수집기는 돚하이의 모든 링크를 자동으로 수집하여 제공합니다.
                </p>
              </div>
              
              <div className={styles.footerLinks}>
                <div className={styles.footerLinkGroup}>
                  <h3 className={`${styles.koreanFont} ${styles.footerLinkTitle}`}>링크</h3>
                  <ul className={`${styles.koreanFont} ${styles.footerLinkList} ${isDarkMode ? styles.footerLinkListDark : styles.footerLinkListLight}`}>
                    <li><a href="https://www.youtube.com/@JU_RURU" className={styles.footerLink}>주르르 유튜브</a></li>
                    <li><a href="https://www.youtube.com/@UnsealedJURURU" className={styles.footerLink}>봉인 풀린 주르르</a></li>
                  </ul>
                </div>
                
                <div className={styles.footerLinkGroup}>
                  <h3 className={`${styles.koreanFont} ${styles.footerLinkTitle}`}>　</h3>
                  <ul className={`${styles.koreanFont} ${styles.footerLinkList} ${isDarkMode ? styles.footerLinkListDark : styles.footerLinkListLight}`}>
                    <li><a href="https://ch.sooplive.co.kr/cotton1217" className={styles.footerLink}>주르르 생방송</a></li>
                    <li><a href="https://cafe.naver.com/steamindiegame" className={styles.footerLink}>왁물원</a></li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className={`${styles.koreanFont} ${styles.footerCopyright} ${isDarkMode ? styles.footerCopyrightDark : styles.footerCopyrightLight}`}>
              <p>&copy; 2025 dotHi. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}