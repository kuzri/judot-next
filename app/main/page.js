'use client';
// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import styles from './page.module.css';
import { db } from "../lib/firebaseConfig";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import WeeklyFilter from '../component/WeeklyFilter';

export default function Main() {
  // const [data, setData] = useState([]);
  const [originData, setOriginData] = useState([]);
  const [mem, setMem] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState({});
  const [groupedData, setGroupedData] = useState({});
  
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
      start: formatDate(startOfWeek),
      end: formatDate(endOfWeek)
    };
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  // 멤버 리스트 정의
  const memberList = ["아이네", "징버거", "릴파", "고세구", "비챤"];

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
        if (item.member && item.member === member) {
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
        item.member && item.member === member
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
        return prevMem.filter(name => name !== memberName);
      } else {
        return [...prevMem, memberName];
      }
    });
  };

  // 전체 선택 함수
  const selectAll = () => {
    setMem([]);
  };

  // 이번 주로 이동하는 함수 (새로 추가)
  const goToThisWeek = () => {
    const now = new Date();
    const day = now.getDay(); // 0(일) ~ 6(토)
    const mondayOffset = day === 0 ? -6 : 1 - day;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + mondayOffset); // 월요일

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // 일요일

    const formatDate = (date) => date.toISOString().split('T')[0];

    const thisWeekRange = {
      start: formatDate(startOfWeek),
      end: formatDate(endOfWeek)
    };

    setWeekRangeFilter(thisWeekRange);
  };

  // 주간 통계 카드 클릭 핸들러 (새로 추가)
  const handleStatCardClick = (memberName) => {
    if (memberName === 'total') {
      selectAll();
    } else {
      toggleMember(memberName);
    }
  };

  const handleWeekChange = (weekRange) => {
    setWeekRangeFilter(weekRange);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // 데이터가 있는지 확인하는 함수
  const hasAnyData = () => {
    return Object.keys(groupedData).length > 0 && 
           Object.values(groupedData).some(videos => videos && videos.length > 0);
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
      const querySnapshot = await getDocs(
        query(collection(db, "scraped_links"), orderBy("uploadedDate", "asc"))
      );
      
      const docs = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .map(doc => ({
          iframeUrl: `${doc.href}/embed?autoPlay=false&mutePlay=false&showChat=false`, 
          ...doc
        }));
      
      setOriginData(docs);
    };
    
    fetchData();
  }, []);

  // 필터링 로직과 주간 통계 계산을 통합한 useEffect
  useEffect(() => {
    // originData가 없으면 아직 로딩 중이므로 필터링하지 않음
    if (originData.length === 0) {
      return;
    }

    // 주간 필터링 먼저 적용 (통계 계산을 위해)
    let weeklyFilteredData = originData;
    if (weekRangeFilter.start && weekRangeFilter.end) {
      weeklyFilteredData = originData.filter(item => 
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
        mem.some(memberName => item.member ===memberName)
      );
    }

    // setData(weeklyFilteredData);
    
    // 멤버별로 데이터 그룹화
    const grouped = groupDataByMember(weeklyFilteredData);
    setGroupedData(grouped);
  }, [originData, mem, weekRangeFilter]);

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
                <a href='https://judot-next.vercel.app/main'  className={`${styles.logo} ${styles.logoFont}`}>
                  돚하이
                </a>
              </div>

              {/* Navigation */}
              <nav className={styles.navigation}>
                <button 
                  className={`${styles.navButton} ${styles.koreanFont} ${
                    mem.length === 0 ? styles.navButtonActive : ''
                  }`} 
                  onClick={selectAll}
                >
                  전체
                </button>
                <button 
                  className={`${styles.navButton} ${styles.koreanFont} ${
                    mem.includes("아이네") ? styles.navButtonIne : ''
                  }`} 
                  onClick={() => toggleMember("아이네")}
                >
                  아이네
                </button>
                <button 
                  className={`${styles.navButton} ${styles.koreanFont} ${
                    mem.includes("징버거") ? styles.navButtonBugat : ''
                  }`} 
                  onClick={() => toggleMember("징버거")}
                >
                  징버거
                </button>
                <button 
                  className={`${styles.navButton} ${styles.koreanFont} ${
                    mem.includes("릴파") ? styles.navButtonLilpa : ''
                  }`} 
                  onClick={() => toggleMember("릴파")}
                >
                  릴파
                </button>
                <button 
                  className={`${styles.navButton} ${styles.koreanFont} ${
                    mem.includes("고세구") ? styles.navButtonGosegu : ''
                  }`} 
                  onClick={() => toggleMember("고세구")}
                >
                  고세구
                </button>
                <button 
                  className={`${styles.navButton} ${styles.koreanFont} ${
                    mem.includes("비챤") ? styles.navButtonVIichan : ''
                  }`} 
                  onClick={() => toggleMember("비챤")}
                >
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
              <div 
                className={`${styles.statCard} ${isDarkMode ? styles.statCardDark : styles.statCardLight} ${
                  mem.length === 0 ? styles.statCardActive : ''
                } ${styles.statCardClickable}`}
                onClick={() => handleStatCardClick('total')}
              >
                <div className={`${styles.koreanFont} ${styles.statLabel} ${isDarkMode ? styles.statLabelDark : styles.statLabelLight}`}>
                  전체
                </div>
                <div className={`${styles.statValue} ${styles.statValueTotal}`}>
                  {weeklyStats.total || 0}
                </div>
              </div>
              
              {memberList.map(member => (
                <div 
                  key={member} 
                  className={`${styles.statCard} ${isDarkMode ? styles.statCardDark : styles.statCardLight} ${
                    mem.includes(member) ? styles[`statCard${member}`] : ''
                  } ${styles.statCardClickable}`}
                  onClick={() => handleStatCardClick(member)}
                >
                  <div className={`${styles.koreanFont} ${styles.statLabel} ${isDarkMode ? styles.statLabelDark : styles.statLabelLight}`}>
                    {member}
                  </div>
                  <div className={`${styles.statValue} ${styles[`statValue${member}`]}`}>
                    {weeklyStats.members?.[member] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 데이터 없음 안내 메시지 */}
          {originData.length > 0 && !hasAnyData() && (
            <div className={`${styles.emptyStateContainer} ${isDarkMode ? styles.emptyStateContainerDark : styles.emptyStateContainerLight}`}>
              <div className={styles.emptyStateContent}>
                <div className={styles.emptyStateIcon}>
                  <Image
                    src="/juDot.png"
                    alt="juDot"
                    width={80}
                    height={80}
                    className={styles.emptyStateImage}
                  />
                </div>
                <h3 className={`${styles.koreanFont} ${styles.emptyStateTitle} ${isDarkMode ? styles.emptyStateTitleDark : styles.emptyStateTitleLight}`}>
                  조건에 맞는 데이터가 없습니다
                </h3>
                <p className={`${styles.koreanFont} ${styles.emptyStateDescription} ${isDarkMode ? styles.emptyStateDescriptionDark : styles.emptyStateDescriptionLight}`}>
                  {mem.length > 0 
                    ? `선택하신 멤버(${mem.join(', ')})의 영상이 해당 기간에 없습니다.` 
                    : '선택하신 기간에 업로드된 영상이 없습니다.'
                  }
                  <br />
                  다른 기간을 선택하거나 필터를 변경해보세요.
                </p>
                <div className={styles.emptyStateButtons}>
                  <button 
                    className={`${styles.koreanFont} ${styles.emptyStateButton} ${isDarkMode ? styles.emptyStateButtonDark : styles.emptyStateButtonLight}`}
                    onClick={selectAll}
                  >
                    전체 보기
                  </button>
                  <button 
                    className={`${styles.koreanFont} ${styles.emptyStateButton} ${styles.emptyStateButtonThisWeek} ${isDarkMode ? styles.emptyStateButtonDark : styles.emptyStateButtonLight}`}
                    onClick={goToThisWeek}
                  >
                    이번 주로 이동
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 로딩 상태 표시 */}
          {originData.length === 0 && (
            <div className={`${styles.loadingContainer} ${isDarkMode ? styles.loadingContainerDark : styles.loadingContainerLight}`}>
              <div className={styles.loadingContent}>
                <div className={styles.loadingSpinner}>⏳</div>
                <p className={`${styles.koreanFont} ${styles.loadingText} ${isDarkMode ? styles.loadingTextDark : styles.loadingTextLight}`}>
                  데이터를 불러오는 중...
                </p>
              </div>
            </div>
          )}
          
          {/* Grouped Video Sections */}
          {hasAnyData() && (
            <div className={styles.groupedVideoSections}>
              {memberList.map(member => {
                const memberVideos = groupedData[member];
                if (!memberVideos || memberVideos.length === 0) return null;
                
                return (
                  <div key={member} className={styles.memberSection}>
                    {/* Member Header */}
                    <div className={`${styles.memberHeader} ${styles[`memberHeader${member}`]} ${isDarkMode ? styles.memberHeaderDark : styles.memberHeaderLight}`}>
                      <h3 className={`${styles.koreanFont} ${styles.memberHeaderTitle} ${styles[`memberHeaderTitle${member}`]} ${isDarkMode ? styles.memberHeaderTitleDark : styles.memberHeaderTitleLight}`}>
                        {member} ({memberVideos.length})
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
          )}
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
                    <li><a href="https://www.youtube.com/@JU_RURU" className={styles.footerLink} target="_blank">주르르 유튜브</a></li>
                    <li><a href="https://www.youtube.com/@UnsealedJURURU" className={styles.footerLink} target="_blank">봉인 풀린 주르르</a></li>
                  </ul>
                </div>
                
                <div className={styles.footerLinkGroup}>
                  <h3 className={`${styles.koreanFont} ${styles.footerLinkTitle}`}>　</h3>
                  <ul className={`${styles.koreanFont} ${styles.footerLinkList} ${isDarkMode ? styles.footerLinkListDark : styles.footerLinkListLight}`}>
                    <li><a href="https://ch.sooplive.co.kr/cotton1217" className={styles.footerLink} target="_blank">주르르 생방송</a></li>
                    <li><a href="https://cafe.naver.com/steamindiegame" className={styles.footerLink} target="_blank">왁물원</a></li>
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