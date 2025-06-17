'use client';
// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from './page.module.css';
import { db } from "../lib/firebaseConfig"; // Firebase 설정 파일에서 db 가져오기
import { collection, getDocs } from "firebase/firestore";

export default function Main() {
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "scraped_links"));
      const docs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).map(doc => ({iframeUrl: `${doc.link.href}/embed?autoPlay=false&amp;mutePlay=true&amp;showChat=false`, ...doc}));
      console.log(docs);
      setData(docs);
    };
    fetchData();
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // 샘플 비디오 데이터 (iframe URL 포함)
  const videos = [
  ];
  
  return (
    <>
      <Head>
        <title>VideoHub - 최신 개발 강의</title>
        <meta name="description" content="전문가들이 제작한 고품질 개발 강의를 만나보세요" />
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
              <div className={`${styles.logo} text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${styles.logoFont}`}>
                VideoHub
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#" className={`${styles.navLink} ${styles.koreanFont} hover:text-blue-600 transition-colors duration-200`}>
                전체
              </a>
              <a href="#" className={`${styles.navLink} ${styles.koreanFont} hover:text-blue-600 transition-colors duration-200`}>
                아이네
              </a>
              <a href="#" className={`${styles.navLink} ${styles.koreanFont} hover:text-blue-600 transition-colors duration-200`}>
                징버거
              </a>
              <a href="#" className={`${styles.navLink} ${styles.koreanFont} hover:text-blue-600 transition-colors duration-200`}>
                릴파
              </a>
                <a href="#" className={`${styles.navLink} ${styles.koreanFont} hover:text-blue-600 transition-colors duration-200`}>
                고세구
              </a>
                <a href="#" className={`${styles.navLink} ${styles.koreanFont} hover:text-blue-600 transition-colors duration-200`}>
                비챤
              </a>
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
          <h1 className={`${styles.heroTitle} ${styles.heroFont} text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent`}>
            돚하이 자동 수집기
          </h1>
          <p className={`${styles.koreanFont} text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto font-light`}>
            수집일 : 2025.06.10~2025.06.17
          </p>
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
                  title={video.link.title}
                  className={`${styles.videoIframe} w-full h-64 border-0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              
              {/* Video Info */}
              <div className="p-6">
                <h3 className={`${styles.videoTitle} ${styles.koreanFont} text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors duration-200`}>
                  {video.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className={`${styles.koreanFont} text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {video.link.title}
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
              <div className={`${styles.logoFont} text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4`}>
                돚하이 자동 수집기
              </div>
              <p className={`${styles.koreanFont} ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4 max-w-md font-light leading-relaxed`}>
                돚하이 자동 수집기는 돚하이의 모든 링크를 자동으로 수집하여 제공합니다.
              </p>
              {/* <div className="flex space-x-4">
                <a href="#" className={`${styles.englishFont} text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium`}>
                  Twitter
                </a>
                <a href="#" className={`${styles.englishFont} text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium`}>
                  GitHub
                </a>
                <a href="#" className={`${styles.englishFont} text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium`}>
                  YouTube
                </a>
              </div> */}
            </div>
            
            <div>
              <h3 className={`${styles.koreanFont} font-semibold mb-4`}>강의</h3>
              <ul className={`${styles.koreanFont} space-y-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-light`}>
                <li><a href="#" className="hover:text-blue-600 transition-colors duration-200">프론트엔드</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors duration-200">같은거 가르치지 않습니다</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className={`${styles.koreanFont} font-semibold mb-4`}>지원</h3>
              <ul className={`${styles.koreanFont} space-y-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-light`}>
                <li><a href="#" className="hover:text-blue-600 transition-colors duration-200">고객센터</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors duration-200">는 없습니다</a></li>
              </ul>
            </div>
          </div>
          
          <div className={`${styles.koreanFont} mt-8 pt-8 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-light`}>
            <p>&copy; 2025 VideoHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}