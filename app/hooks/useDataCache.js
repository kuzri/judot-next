// hooks/useDataCache.js
import { useState, useEffect, useCallback } from 'react';

const CACHE_KEY = 'video_data_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10분

export const useDataCache = () => {
  const [cachedData, setCachedData] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // 캐시에서 데이터 로드
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const lastFetchTime = localStorage.getItem(`${CACHE_KEY}_timestamp`);
      
      if (cached && lastFetchTime) {
        const timeSinceLastFetch = Date.now() - parseInt(lastFetchTime);
        
        // 캐시가 유효한 경우에만 사용
        if (timeSinceLastFetch < CACHE_DURATION) {
          setCachedData(JSON.parse(cached));
          setLastFetch(parseInt(lastFetchTime));
        }
      }
    } catch (error) {
      console.error('캐시 로드 실패:', error);
    }
  }, []);

  // 데이터를 캐시에 저장
  const setCacheData = useCallback((data) => {
    try {
      const timestamp = Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(`${CACHE_KEY}_timestamp`, timestamp.toString());
      setCachedData(data);
      setLastFetch(timestamp);
    } catch (error) {
      console.error('캐시 저장 실패:', error);
    }
  }, []);

  // 캐시 유효성 검사
  const isCacheValid = useCallback(() => {
    if (!lastFetch) return false;
    return (Date.now() - lastFetch) < CACHE_DURATION;
  }, [lastFetch]);

  // 캐시 무효화
  const invalidateCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(`${CACHE_KEY}_timestamp`);
    setCachedData(null);
    setLastFetch(null);
  }, []);

  return {
    cachedData,
    setCacheData,
    isCacheValid,
    invalidateCache,
    lastFetch
  };
};