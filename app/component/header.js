import { useState, useEffect, useCallback } from 'react';
import styles from './header.module.css';

// 상수 정의
const MEMBER_LIST = ["아이네", "징버거", "릴파", "고세구", "비챤"];
const MEMBER_COLORS = {
  아이네: 'Ine',
  징버거: 'Bugat', 
  릴파: 'Lilpa',
  고세구: 'Gosegu',
  비챤: 'VIichan'
};

// 사이드바 훅
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

// 헤더 컴포넌트
const Header = ({ 
  isDarkMode, 
  selectedMembers, 
  onMemberToggle, 
  onSelectAll, 
  onToggleDarkMode
}) => {
  const { isSidebarOpen, openSidebar, closeSidebar } = useSidebar();

  return (
    <>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        isDarkMode={isDarkMode}
        selectedMembers={selectedMembers}
        onMemberToggle={onMemberToggle}
        onSelectAll={onSelectAll}
        onToggleDarkMode={onToggleDarkMode}
      />

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
                onClick={openSidebar}
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
    </>
  );
};

export default Header;