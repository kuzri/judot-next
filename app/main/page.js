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

  // 멤버별 색상 정의
  const memberColors = {
    "아이네": {
      text: "text-purple-600 dark:text-purple-300",
      bg: "bg-purple-100 dark:bg-purple-900"
    },
    "부가땅": {
      text: "text-amber-600 dark:text-amber-300", 
      bg: "bg-amber-100 dark:bg-amber-900"
    },
    "릴파": {
      text: "text-indigo-600 dark:text-blue-300",
      bg: "bg-indigo-100 dark:bg-blue-900"
    },
    "고세구": {
      text: "text-blue-600 dark:text-sky-300",
      bg: "bg-blue-100 dark:bg-sky-900"
    },
    "비챤": {
      text: "text-green-600 dark:text-green-300",
      bg: "bg-green-100 dark:bg-green-900"
    }
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

  // 멤버 버튼 스타일 함수
  const getMemberButtonStyle = (memberName) => {
    const isSelected = mem.includes(memberName);
    const baseStyle = `${styles.navLink} ${styles.koreanFont} transition-colors duration-200`;
    
    if (isSelected) {
      const colors = memberColors[memberName];
      return `${baseStyle} ${colors.text} ${colors.bg} px-3 py-1 rounded-md`;
    } else {
      return `${baseStyle} hover:text-pink-600 transition-colors duration-200`;
    }
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
      const querySnapshot = await getDocs(query(collection(db, "scraped_links"),orderBy("uploadedDate", "desc")));
      
      const docs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).map(doc => ({iframeUrl: `${doc.href}/embed?autoPlay=false&amp;mutePlay=false&amp;showChat=false`, ...doc}));
      setOriginData(docs);
    };
    fetchData();
  }, []);

  // 필터링 로직을 통합한 useEffect
  useEffect(() => {
    console.log("originData"+originData);
    // originData가 없으면 아직 로딩 중이므로 필터링하지 않음
    if (originData.length === 0) {
      return;
    }

    let result = originData;

    // 멤버 필터링
    if (mem.length > 0) {
      result = result.filter(item => 
        mem.some(memberName => item.text.includes(memberName))
      );
    }
    console.log("mem result" + result);
    console.log("mem result" + JSON.stringify(result, null, 2));

    // 주간 필터링 (초기값이 설정되어 있으므로 항상 적용)
    if (weekRangeFilter.start && weekRangeFilter.end) {
      console.log("weekRangeFilter.start", weekRangeFilter.start);
      console.log("weekRangeFilter.end", weekRangeFilter.end);
      result = result.filter(item => 
        item.uploadedDate >= weekRangeFilter.start && 
        item.uploadedDate <= weekRangeFilter.end
      );
    }

    setData(result);
    console.log("Filtered data:", data);
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
      <div className={`min-h-screen transition-colors duration-300 ${styles.fontOptimized} ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'
      }`}>
      {/* Header */}
      <header className={`${styles.header} ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border-b sticky top-0 z-50 backdrop-blur-sm bg-opacity-95`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className={`${styles.logo} text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent ${styles.logoFont}`}>
                돚하이
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-4">
              <button 
                className={`${styles.navLink} ${styles.koreanFont} ${
                  mem.length === 0 
                    ? 'text-pink-600 bg-pink-100 dark:bg-pink-900 dark:text-pink-300 px-3 py-1 rounded-md' 
                    : 'hover:text-pink-600'
                } transition-colors duration-200`} 
                onClick={selectAll}>
                전체
              </button>
              <button 
                className={getMemberButtonStyle("아이네")} 
                onClick={() => toggleMember("아이네")}>
                아이네
              </button>
              <button 
                className={getMemberButtonStyle("부가땅")} 
                onClick={() => toggleMember("부가땅")}>
                징버거
              </button>
              <button 
                className={getMemberButtonStyle("릴파")} 
                onClick={() => toggleMember("릴파")}>
                릴파
              </button>
              <button 
                className={getMemberButtonStyle("고세구")} 
                onClick={() => toggleMember("고세구")}>
                고세구
              </button>
              <button 
                className={getMemberButtonStyle("비챤")} 
                onClick={() => toggleMember("비챤")}>
                비챤
              </button>
            </nav>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`${styles.toggleButton} p-2 rounded-full transition-all duration-300 transform hover:scale-110 ${
                isDarkMode 
                  ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' 
                  : 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
              }`}
              aria-label="다크모드 토글"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className='text-4xl'>
            🎀<span className={`${styles.heroTitle} ${styles.heroFont} text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 bg-clip-text text-transparent`}>돚하이 자동 수집기</span>🎀
          </h1>
          <WeeklyFilter 
            className={`${styles.koreanFont} text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto font-light`} 
            onWeekChange={handleWeekChange} 
            initialWeekRange={weekRangeFilter}
          />
          
          {/* 현재 필터 상태 표시 */}
          {mem.length > 0 && (
            <div className="mt-4">
              <p className={`${styles.koreanFont} text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                현재 필터: {mem.join(', ')}
              </p>
            </div>
          )}
        </div>
        
        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.map((video) => (
            <div
              key={video.id}
              className={`${styles.videoCard} group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                isDarkMode 
                  ? 'bg-gray-800 hover:bg-gray-750 border-gray-700' 
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              } rounded-xl border overflow-hidden`}
            >
              {/* Iframe Container */}
              <div className={`${styles.iframeContainer} relative`}>
                <iframe
                  src={video.iframeUrl}
                  title={video.title}
                  className={`${styles.videoIframe} w-full h-64 border-0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              
              {/* Video Info */}
              <div className="p-6">
                <h3 className={`${styles.videoTitle} ${styles.koreanFont} text-lg font-semibold mb-2 group-hover:text-pink-600 transition-colors duration-200`}>
                  {video.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className={`${styles.koreanFont} text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {video.title}
                  </span>
                  <div className="flex items-center space-x-1">
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className={`${styles.footer} mt-20 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      } border-t`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className={`${styles.logoFont} text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent mb-4`}>
                돚하이 자동 수집기
              </div>
              <p className={`${styles.koreanFont} ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4 max-w-md font-light leading-relaxed`}>
                돚하이 자동 수집기는 돚하이의 모든 링크를 자동으로 수집하여 제공합니다.
              </p>
            </div>
            
            <div>
              <h3 className={`${styles.koreanFont} font-semibold mb-4`}>링크</h3>
              <ul className={`${styles.koreanFont} space-y-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-light`}>
                <li><a href="https://www.youtube.com/@JU_RURU" className="hover:text-pink-600 transition-colors duration-200">주르르 유튜브</a></li>
                <li><a href="https://www.youtube.com/@UnsealedJURURU" className="hover:text-pink-600 transition-colors duration-200">봉인 풀린 주르르</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className={`${styles.koreanFont} font-semibold mb-4`}>　</h3>
              <ul className={`${styles.koreanFont} space-y-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-light`}>
                <li><a href="https://ch.sooplive.co.kr/cotton1217" className="hover:text-pink-600 transition-colors duration-200">주르르 생방송</a></li>
                <li><a href="https://cafe.naver.com/steamindiegame" className="hover:text-pink-600 transition-colors duration-200">왁물원</a></li>
              </ul>
            </div>
          </div>
          
          <div className={`${styles.koreanFont} mt-8 pt-8 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-light`}>
            <p>&copy; 2025 dotHi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}