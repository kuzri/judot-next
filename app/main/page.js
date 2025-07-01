'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import styles from './page.module.css';
import { firebaseService } from '../services/firebaseService';
import { useDataCache } from '../hooks/useDataCache';
import WeeklyFilter from '../component/WeeklyFilter';

// 상수 정의
const MEMBER_LIST = ["아이네", "징버거", "릴파", "고세구", "비챤"];
const MEMBER_COLORS = {
  아이네: 'Ine',
  징버거: 'Bugat', 
  릴파: 'Lilpa',
  고세구: 'Gosegu',
  비챤: 'VIichan'
};

// 유틸리티 함수들
const formatDate = (date) => date.toLocaleDateString('ko-CA');

const getCurrentWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + mondayOffset);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return {
    start: formatDate(startOfWeek),
    end: formatDate(endOfWeek)
  };
};

// 커스텀 훅
const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  return { isDarkMode, toggleDarkMode };
};

const useDataFetching = () => {
  const [originData, setOriginData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { cachedData, setCacheData, isCacheValid } = useDataCache();

  const fetchData = useCallback(async (useCache = true) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (useCache && cachedData && isCacheValid()) {
        setOriginData(cachedData);
        return;
      }
      
      const data = await firebaseService.fetchScrapedLinks(!useCache);
      setOriginData(data);
      setCacheData(data);
    } catch (error) {
      console.error('데이터 fetch 실패:', error);
      setError('데이터를 불러오는데 실패했습니다.');
      
      if (cachedData) {
        setOriginData(cachedData);
      }
    } finally {
      setIsLoading(false);
    }
  }, [cachedData, isCacheValid, setCacheData]);

  const refreshData = useCallback(() => fetchData(false), [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { originData, isLoading, error, refreshData };
};

const useFilters = () => {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [weekRangeFilter, setWeekRangeFilter] = useState(getCurrentWeekRange);

  const toggleMember = useCallback((memberName) => {
    setSelectedMembers(prev => 
      prev.includes(memberName) 
        ? prev.filter(name => name !== memberName)
        : [...prev, memberName]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedMembers([]);
  }, []);

  const goToThisWeek = useCallback(() => {
    setWeekRangeFilter(getCurrentWeekRange());
  }, []);

  const handleWeekChange = useCallback((weekRange) => {
    setWeekRangeFilter(weekRange);
  }, []);

  return {
    selectedMembers,
    weekRangeFilter,
    toggleMember,
    selectAll,
    goToThisWeek,
    handleWeekChange
  };
};

const useSidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // 사이드바가 열려있을 때 바디 스크롤 방지
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  return { isSidebarOpen, openSidebar, closeSidebar, toggleSidebar };
};

// 사이드바 컴포넌트
const Sidebar = ({ 
  isOpen, 
  onClose, 
  isDarkMode, 
  selectedMembers, 
  onMemberToggle, 
  onSelectAll,
  onToggleDarkMode 
}) => {
  return (
    <>
      {/* 백드롭 */}
      {isOpen && (
        <div 
          className={styles.sidebarBackdrop}
          onClick={onClose}
        />
      )}
      
      {/* 사이드바 */}
      <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : styles.sidebarClosed} ${
        isDarkMode ? styles.sidebarDark : styles.sidebarLight
      }`}>
        <div className={styles.sidebarHeader}>
          <h2 className={`${styles.koreanFont} ${styles.sidebarTitle}`}>메뉴</h2>
          <button 
            className={styles.sidebarCloseButton}
            onClick={onClose}
            aria-label="사이드바 닫기"
          >
            ✕
          </button>
        </div>

        <nav className={styles.sidebarNavigation}>
          <button 
            className={`${styles.sidebarNavButton} ${styles.koreanFont} ${
              selectedMembers.length === 0 ? styles.sidebarNavButtonActive : ''
            }`} 
            onClick={() => {
              onSelectAll();
              onClose();
            }}
          >
            전체
          </button>
          {MEMBER_LIST.map(member => (
            <button 
              key={member}
              className={`${styles.sidebarNavButton} ${styles.koreanFont} ${
                selectedMembers.includes(member) ? styles[`sidebarNavButton${MEMBER_COLORS[member]}`] : ''
              }`} 
              onClick={() => {
                onMemberToggle(member);
                onClose();
              }}
            >
              {member}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            onClick={() => {
              onToggleDarkMode();
              onClose();
            }}
            className={`${styles.sidebarToggleButton} ${isDarkMode ? styles.sidebarToggleButtonDark : styles.sidebarToggleButtonLight}`}
            aria-label="다크모드 토글"
          >
            {isDarkMode ? '☀️ 라이트 모드' : '🌙 다크 모드'}
          </button>
        </div>
      </div>
    </>
  );
};

// 컴포넌트들
const Header = ({ 
  isDarkMode, 
  selectedMembers, 
  onMemberToggle, 
  onSelectAll, 
  onToggleDarkMode,
  onOpenSidebar 
}) => (
  <header className={`${styles.header} ${isDarkMode ? styles.headerDark : styles.headerLight}`}>
    <div className={styles.headerContainer}>
      <div className={styles.headerContent}>
        <div className={styles.logoContainer}>
          <a href='https://judot-next.vercel.app/main' className={`${styles.logo} ${styles.logoFont}`}>
            돚하이
          </a>
        </div>

        {/* 데스크톱 네비게이션 */}
        <nav className={styles.navigation}>
          <button 
            className={`${styles.navButton} ${styles.koreanFont} ${
              selectedMembers.length === 0 ? styles.navButtonActive : ''
            }`} 
            onClick={onSelectAll}
          >
            전체
          </button>
          {MEMBER_LIST.map(member => (
            <button 
              key={member}
              className={`${styles.navButton} ${styles.koreanFont} ${
                selectedMembers.includes(member) ? styles[`navButton${MEMBER_COLORS[member]}`] : ''
              }`} 
              onClick={() => onMemberToggle(member)}
            >
              {member}
            </button>
          ))}
        </nav>

        <div className={styles.headerActions}>
          {/* 햄버거 메뉴 버튼 (모바일에서만 표시) */}
          <button
            onClick={onOpenSidebar}
            className={`${styles.hamburgerButton} ${isDarkMode ? styles.hamburgerButtonDark : styles.hamburgerButtonLight}`}
            aria-label="메뉴 열기"
          >
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
          </button>

          {/* 데스크톱 다크모드 토글 */}
          <button
            onClick={onToggleDarkMode}
            className={`${styles.toggleButton} ${isDarkMode ? styles.toggleButtonDark : styles.toggleButtonLight}`}
            aria-label="다크모드 토글"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </div>
  </header>
);

const WeeklyStats = ({ stats, selectedMembers, isDarkMode, onStatCardClick }) => (
  <div className={`${styles.weeklyStatsSection} ${isDarkMode ? styles.weeklyStatsSectionDark : styles.weeklyStatsSectionLight}`}>
    <h2 className={`${styles.koreanFont} ${styles.weeklyStatsTitle} ${isDarkMode ? styles.weeklyStatsTitleDark : styles.weeklyStatsTitleLight}`}>
      📊 주간 통계
    </h2>
    <div className={styles.statsGrid}>
      <div 
        className={`${styles.statCard} ${isDarkMode ? styles.statCardDark : styles.statCardLight} ${
          selectedMembers.length === 0 ? styles.statCardActive : ''
        } ${styles.statCardClickable}`}
        onClick={() => onStatCardClick('total')}
      >
        <div className={`${styles.koreanFont} ${styles.statLabel} ${isDarkMode ? styles.statLabelDark : styles.statLabelLight}`}>
          전체
        </div>
        <div className={`${styles.statValue} ${styles.statValueTotal}`}>
          {stats.total || 0}
        </div>
      </div>
      
      {MEMBER_LIST.map(member => (
        <div 
          key={member} 
          className={`${styles.statCard} ${isDarkMode ? styles.statCardDark : styles.statCardLight} ${
            selectedMembers.includes(member) ? styles[`statCard${member}`] : ''
          } ${styles.statCardClickable}`}
          onClick={() => onStatCardClick(member)}
        >
          <div className={`${styles.koreanFont} ${styles.statLabel} ${isDarkMode ? styles.statLabelDark : styles.statLabelLight}`}>
            {member}
          </div>
          <div className={`${styles.statValue} ${styles[`statValue${member}`]}`}>
            {stats.members?.[member] || 0}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const EmptyState = ({ selectedMembers, isDarkMode, onSelectAll, onGoToThisWeek }) => (
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
        {selectedMembers.length > 0 
          ? `선택하신 멤버(${selectedMembers.join(', ')})의 영상이 해당 기간에 없습니다.` 
          : '선택하신 기간에 업로드된 영상이 없습니다.'
        }
        <br />
        다른 기간을 선택하거나 필터를 변경해보세요.
      </p>
      <div className={styles.emptyStateButtons}>
        <button 
          className={`${styles.koreanFont} ${styles.emptyStateButton} ${isDarkMode ? styles.emptyStateButtonDark : styles.emptyStateButtonLight}`}
          onClick={onSelectAll}
        >
          전체 보기
        </button>
        <button 
          className={`${styles.koreanFont} ${styles.emptyStateButton} ${styles.emptyStateButtonThisWeek} ${isDarkMode ? styles.emptyStateButtonDark : styles.emptyStateButtonLight}`}
          onClick={onGoToThisWeek}
        >
          이번 주로 이동
        </button>
      </div>
    </div>
  </div>
);

const LoadingState = ({ isDarkMode }) => (
  <div className={`${styles.loadingContainer} ${isDarkMode ? styles.loadingContainerDark : styles.loadingContainerLight}`}>
    <div className={styles.loadingContent}>
      <div className={styles.loadingSpinner}>⏳</div>
      <p className={`${styles.koreanFont} ${styles.loadingText} ${isDarkMode ? styles.loadingTextDark : styles.loadingTextLight}`}>
        데이터를 불러오는 중...
      </p>
    </div>
  </div>
);

const ErrorState = ({ error, isDarkMode, onRetry }) => (
  <div className={`${styles.errorContainer} ${isDarkMode ? styles.errorContainerDark : styles.errorContainerLight}`}>
    <div className={styles.errorContent}>
      <span className={styles.errorIcon}>⚠️</span>
      <p className={`${styles.koreanFont} ${styles.errorText}`}>{error}</p>
      <button 
        className={`${styles.koreanFont} ${styles.retryButton}`}
        onClick={onRetry}
      >
        다시 시도
      </button>
    </div>
  </div>
);

const VideoCard = ({ video, isDarkMode }) => (
  <div className={`${styles.videoCard} ${isDarkMode ? styles.videoCardDark : styles.videoCardLight}`}>
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
);

const VideoSections = ({ groupedData, isDarkMode }) => (
  <div className={styles.groupedVideoSections}>
    {MEMBER_LIST.map(member => {
      const memberVideos = groupedData[member];
      if (!memberVideos || memberVideos.length === 0) return null;
      
      return (
        <div key={member} className={styles.memberSection}>
          <div className={`${styles.memberHeader} ${styles[`memberHeader${member}`]} ${isDarkMode ? styles.memberHeaderDark : styles.memberHeaderLight}`}>
            <h3 className={`${styles.koreanFont} ${styles.memberHeaderTitle} ${styles[`memberHeaderTitle${member}`]} ${isDarkMode ? styles.memberHeaderTitleDark : styles.memberHeaderTitleLight}`}>
              {member} ({memberVideos.length})
            </h3>
          </div>
          
          <div className={styles.videoGrid}>
            {memberVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

const Footer = ({ isDarkMode }) => (
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
              <li><a href="https://www.youtube.com/@JU_RURU" className={styles.footerLink} target="_blank" rel="noopener noreferrer">주르르 유튜브</a></li>
              <li><a href="https://www.youtube.com/@UnsealedJURURU" className={styles.footerLink} target="_blank" rel="noopener noreferrer">봉인 풀린 주르르</a></li>
            </ul>
          </div>
          
          <div className={styles.footerLinkGroup}>
            <h3 className={`${styles.koreanFont} ${styles.footerLinkTitle}`}>　</h3>
            <ul className={`${styles.koreanFont} ${styles.footerLinkList} ${isDarkMode ? styles.footerLinkListDark : styles.footerLinkListLight}`}>
              <li><a href="https://ch.sooplive.co.kr/cotton1217" className={styles.footerLink} target="_blank" rel="noopener noreferrer">주르르 생방송</a></li>
              <li><a href="https://cafe.naver.com/steamindiegame" className={styles.footerLink} target="_blank" rel="noopener noreferrer">왁물원</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className={`${styles.koreanFont} ${styles.footerCopyright} ${isDarkMode ? styles.footerCopyrightDark : styles.footerCopyrightLight}`}>
        <p>&copy; 2025 dotHi. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

// 메인 컴포넌트
export default function Main() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { originData, isLoading, error, refreshData } = useDataFetching();
  const {
    selectedMembers,
    weekRangeFilter,
    toggleMember,
    selectAll,
    goToThisWeek,
    handleWeekChange
  } = useFilters();
  const { isSidebarOpen, openSidebar, closeSidebar } = useSidebar();

  // 주간 통계 계산
  const weeklyStats = useMemo(() => {
    if (originData.length === 0) return { total: 0, members: {} };

    const weeklyFilteredData = originData.filter(item => 
      item.uploadedDate >= weekRangeFilter.start && 
      item.uploadedDate <= weekRangeFilter.end
    );

    const stats = {
      total: weeklyFilteredData.length,
      members: {}
    };

    MEMBER_LIST.forEach(member => {
      stats.members[member] = weeklyFilteredData.filter(item => item.member === member).length;
    });

    return stats;
  }, [originData, weekRangeFilter]);

  // 그룹화된 데이터 계산
  const groupedData = useMemo(() => {
    if (originData.length === 0) return {};

    let filteredData = originData.filter(item => 
      item.uploadedDate >= weekRangeFilter.start && 
      item.uploadedDate <= weekRangeFilter.end
    );

    if (selectedMembers.length > 0) {
      filteredData = filteredData.filter(item => 
        selectedMembers.includes(item.member)
      );
    }

    const grouped = {};
    MEMBER_LIST.forEach(member => {
      const memberVideos = filteredData.filter(item => item.member === member);
      if (memberVideos.length > 0) {
        grouped[member] = memberVideos;
      }
    });

    return grouped;
  }, [originData, selectedMembers, weekRangeFilter]);

  const hasAnyData = useMemo(() => {
    return Object.keys(groupedData).length > 0 && 
           Object.values(groupedData).some(videos => videos && videos.length > 0);
  }, [groupedData]);

  const handleStatCardClick = useCallback((memberName) => {
    if (memberName === 'total') {
      selectAll();
    } else {
      toggleMember(memberName);
    }
  }, [selectAll, toggleMember]);

  return (
    <>
      <Head>
        <title>돚하이</title>
        <meta name="description" content="돚하이" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Pretendard:wght@100;200;300;400;500;600;700;800;900&family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" 
          rel="stylesheet" 
        />
      </Head>
      
      <div className={`${styles.container} ${styles.fontOptimized} ${isDarkMode ? styles.darkMode : styles.lightMode}`}>
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          isDarkMode={isDarkMode}
          selectedMembers={selectedMembers}
          onMemberToggle={toggleMember}
          onSelectAll={selectAll}
          onToggleDarkMode={toggleDarkMode}
        />

        <Header
          isDarkMode={isDarkMode}
          selectedMembers={selectedMembers}
          onMemberToggle={toggleMember}
          onSelectAll={selectAll}
          onToggleDarkMode={toggleDarkMode}
          onOpenSidebar={openSidebar}
        />

        <main className={styles.mainContent}>
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

          {error && (
            <ErrorState 
              error={error}
              isDarkMode={isDarkMode}
              onRetry={refreshData}
            />
          )}

          <WeeklyStats
            stats={weeklyStats}
            selectedMembers={selectedMembers}
            isDarkMode={isDarkMode}
            onStatCardClick={handleStatCardClick}
          />
          
          {!isLoading && originData.length > 0 && !hasAnyData && (
            <EmptyState
              selectedMembers={selectedMembers}
              isDarkMode={isDarkMode}
              onSelectAll={selectAll}
              onGoToThisWeek={goToThisWeek}
            />
          )}

          {isLoading && <LoadingState isDarkMode={isDarkMode} />}
          
          {hasAnyData && (
            <VideoSections
              groupedData={groupedData}
              isDarkMode={isDarkMode}
            />
          )}
        </main>

        <Footer isDarkMode={isDarkMode} />
      </div>
    </>
  );
}