'use client';
// pages/index.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import styles from './page.module.css';
import { firebaseService } from '../services/firebaseService';
import { useDataCache } from '../hooks/useDataCache';
import WeeklyFilter from '../component/WeeklyFilter';

export default function Main() {
  const [originData, setOriginData] = useState([]);
  const [mem, setMem] = useState([]);
  const [weekRangeFilter, setWeekRangeFilter] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + mondayOffset);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const formatDate = (date) => date.toISOString().split('T')[0];

    return {
      start: formatDate(startOfWeek),
      end: formatDate(endOfWeek)
    };
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 데이터 캐시 훅 사용
  // const { cachedData, setCacheData, isCacheValid, invalidateCache } = useDataCache();
  const { cachedData, setCacheData, isCacheValid } = useDataCache();

  // 멤버 리스트를 상수로 정의 (리렌더링 방지)
  const memberList = useMemo(() => ["아이네", "징버거", "릴파", "고세구", "비챤"], []);

  // 주간 통계 계산 함수를 useMemo로 메모이제이션
  const weeklyStats = useMemo(() => {
    if (originData.length === 0) return { total: 0, members: {} };

    // 주간 필터링
    const weeklyFilteredData = originData.filter(item => 
      item.uploadedDate >= weekRangeFilter.start && 
      item.uploadedDate <= weekRangeFilter.end
    );

    const stats = {
      total: weeklyFilteredData.length,
      members: {}
    };

    // 각 멤버별 카운트 초기화
    memberList.forEach(member => {
      stats.members[member] = 0;
    });

    // 데이터를 순회하며 각 멤버별 카운트
    weeklyFilteredData.forEach(item => {
      if (item.member && memberList.includes(item.member)) {
        stats.members[item.member]++;
      }
    });

    return stats;
  }, [originData, weekRangeFilter, memberList]);

  // 그룹화된 데이터를 useMemo로 메모이제이션
  const groupedData = useMemo(() => {
    if (originData.length === 0) return {};

    // 주간 필터링
    let filteredData = originData.filter(item => 
      item.uploadedDate >= weekRangeFilter.start && 
      item.uploadedDate <= weekRangeFilter.end
    );

    // 멤버 필터링
    if (mem.length > 0) {
      filteredData = filteredData.filter(item => 
        mem.includes(item.member)
      );
    }

    // 멤버별 그룹화
    const grouped = {};
    memberList.forEach(member => {
      const memberVideos = filteredData.filter(item => item.member === member);
      if (memberVideos.length > 0) {
        grouped[member] = memberVideos;
      }
    });

    return grouped;
  }, [originData, mem, weekRangeFilter, memberList]);

  // 콜백 함수들을 useCallback으로 메모이제이션
  const toggleMember = useCallback((memberName) => {
    setMem(prevMem => {
      if (prevMem.includes(memberName)) {
        return prevMem.filter(name => name !== memberName);
      } else {
        return [...prevMem, memberName];
      }
    });
  }, []);

  const selectAll = useCallback(() => {
    setMem([]);
  }, []);

  const goToThisWeek = useCallback(() => {
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + mondayOffset);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const formatDate = (date) => date.toISOString().split('T')[0];

    setWeekRangeFilter({
      start: formatDate(startOfWeek),
      end: formatDate(endOfWeek)
    });
  }, []);

  const handleStatCardClick = useCallback((memberName) => {
    if (memberName === 'total') {
      selectAll();
    } else {
      toggleMember(memberName);
    }
  }, [selectAll, toggleMember]);

  const handleWeekChange = useCallback((weekRange) => {
    setWeekRangeFilter(weekRange);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // 데이터 새로고침 함수
  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 캐시 무효화 후 새 데이터 가져오기
      const freshData = await firebaseService.fetchScrapedLinks(false);
      setOriginData(freshData);
      setCacheData(freshData);
    } catch (error) {
      console.error('데이터 새로고침 실패:', error);
      setError('데이터를 새로고침하는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [setCacheData]);

  // 데이터 존재 여부 확인을 useMemo로 메모이제이션
  const hasAnyData = useMemo(() => {
    return Object.keys(groupedData).length > 0 && 
           Object.values(groupedData).some(videos => videos && videos.length > 0);
  }, [groupedData]);

  // 다크모드 초기화 (한 번만 실행)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // 다크모드 변경시 localStorage 업데이트
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Firebase 데이터 fetch (캐시 우선 적용)
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 유효한 캐시가 있는 경우 캐시 데이터 사용
        if (cachedData && isCacheValid()) {
          setOriginData(cachedData);
          setIsLoading(false);
          return;
        }
        
        // 캐시가 없거나 유효하지 않은 경우 Firebase에서 데이터 가져오기
        const data = await firebaseService.fetchScrapedLinks();
        
        if (!isMounted) return;
        
        setOriginData(data);
        setCacheData(data);
      } catch (error) {
        console.error('데이터 fetch 실패:', error);
        setError('데이터를 불러오는데 실패했습니다.');
        
        // 에러 발생시 캐시된 데이터라도 사용
        if (cachedData && !isMounted) {
          setOriginData(cachedData);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [cachedData, isCacheValid, setCacheData]);

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
                {memberList.map(member => (
                  <button 
                    key={member}
                    className={`${styles.navButton} ${styles.koreanFont} ${
                      mem.includes(member) ? styles[`navButton${member}`] : ''
                    }`} 
                    onClick={() => toggleMember(member)}
                  >
                    {member}
                  </button>
                ))}
              </nav>

              {/* Refresh Button & Dark Mode Toggle */}
              <div className={styles.headerActions}>
                {/* <button
                  onClick={refreshData}
                  disabled={isLoading}
                  className={`${styles.refreshButton} ${isDarkMode ? styles.refreshButtonDark : styles.refreshButtonLight}`}
                  aria-label="데이터 새로고침"
                >
                  {isLoading ? '⏳' : '🔄'}
                </button> */}
                <button
                  onClick={toggleDarkMode}
                  className={`${styles.toggleButton} ${isDarkMode ? styles.toggleButtonDark : styles.toggleButtonLight}`}
                  aria-label="다크모드 토글"
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
              </div>
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
            {/* 캐시 상태 표시 */}
            {/* {cachedData && isCacheValid() && !isLoading && (
              <div className={`${styles.cacheStatus} ${isDarkMode ? styles.cacheStatusDark : styles.cacheStatusLight}`}>
                <span className={styles.koreanFont}>
                  💾 캐시된 데이터 사용 중 (최신 업데이트: {new Date().toLocaleTimeString()})
                </span>
              </div>
            )} */}
          </div>

          {/* 에러 상태 표시 */}
          {error && (
            <div className={`${styles.errorContainer} ${isDarkMode ? styles.errorContainerDark : styles.errorContainerLight}`}>
              <div className={styles.errorContent}>
                <span className={styles.errorIcon}>⚠️</span>
                <p className={`${styles.koreanFont} ${styles.errorText}`}>{error}</p>
                <button 
                  className={`${styles.koreanFont} ${styles.retryButton}`}
                  onClick={refreshData}
                >
                  다시 시도
                </button>
              </div>
            </div>
          )}

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
          {!isLoading && originData.length > 0 && !hasAnyData && (
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
          {isLoading && (
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
          {hasAnyData && (
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
                              loading="lazy"
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