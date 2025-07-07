// hooks/useVisitorCount.js
import { useState, useEffect, useRef } from 'react';
import { firebaseService } from '../services/firebaseService';

export const useVisitorCount = () => {
  const [visitorStats, setVisitorStats] = useState({
    total: 0,
    today: 0,
    isLoading: false,
    error: null
  });

  const hasIncrementedRef = useRef(false);

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기 (Firebase용)
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const initVisitorCount = async () => {
      // 일단 로딩 표시
      setVisitorStats(prev => ({ ...prev, isLoading: true }));
      
      try {
        // 방문자 카운트 증가 (한 번만)
        if (!hasIncrementedRef.current) {
          await firebaseService.incrementVisitorCount();
          hasIncrementedRef.current = true;
        }
        
        // 통계 가져오기
        const stats = await firebaseService.getVisitorStats();
        
        setVisitorStats({
          total: stats.total || 0,
          today: stats.today || 0,
          isLoading: false,
          error: null
        });

        // 실시간 구독 설정
        const unsubscribe = firebaseService.subscribeToVisitorStats((newStats) => {
          setVisitorStats({
            total: newStats.total || 0,
            today: newStats.today || 0,
            isLoading: false,
            error: null
          });
        });

        return unsubscribe;
        
      } catch (error) {
        console.error('Firebase 오류:', error);
        // 에러 발생해도 기본값 표시
        setVisitorStats({
          total: 1,
          today: 1,
          isLoading: false,
          error: 'Firebase 연결 실패'
        });
      }
    };

    let unsubscribe;
    initVisitorCount().then(unsub => {
      if (unsub) unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const refreshStats = async () => {
    setVisitorStats(prev => ({ ...prev, isLoading: true }));
    try {
      const stats = await firebaseService.getVisitorStats();
      setVisitorStats({
        total: stats.total || 0,
        today: stats.today || 0,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setVisitorStats(prev => ({
        ...prev,
        isLoading: false,
        error: '새로고침 실패'
      }));
    }
  };

  return { visitorStats, refreshStats };
};