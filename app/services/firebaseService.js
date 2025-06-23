// services/firebaseService.js
import { db } from "../lib/firebaseConfig";
import { collection, query, orderBy, getDocs, limit, startAfter } from "firebase/firestore";

class FirebaseService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10분
  }

  // 캐시 키 생성
  getCacheKey(collectionName, orderField, limitValue = null) {
    return `${collectionName}_${orderField}_${limitValue}`;
  }

  // 캐시 유효성 검사
  isCacheValid(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    return (Date.now() - cached.timestamp) < this.cacheTimeout;
  }

  // 데이터 가져오기 (캐시 포함)
  async fetchScrapedLinks(useCache = true) {
    const cacheKey = this.getCacheKey('scraped_links', 'uploadedDate');
    
    // 캐시 확인
    if (useCache && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const querySnapshot = await getDocs(
        query(collection(db, "scraped_links"), orderBy("uploadedDate", "asc"))
      );
      
      const docs = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .map(doc => ({
          iframeUrl: `${doc.href}/embed?autoPlay=false&mutePlay=false&showChat=false`, 
          ...doc
        }));

      // 캐시 저장
      this.cache.set(cacheKey, {
        data: docs,
        timestamp: Date.now()
      });

      return docs;
    } catch (error) {
      console.error('Firebase 데이터 fetch 실패:', error);
      
      // 에러 발생시 오래된 캐시라도 사용
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached.data;
      }
      
      throw error;
    }
  }

  // 페이지네이션 지원 데이터 가져오기
  async fetchScrapedLinksWithPagination(pageSize = 50, lastDoc = null) {
    try {
      let baseQuery = query(
        collection(db, "scraped_links"), 
        orderBy("uploadedDate", "asc"),
        limit(pageSize)
      );

      if (lastDoc) {
        baseQuery = query(baseQuery, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(baseQuery);
      
      const docs = querySnapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data(),
        iframeUrl: `${doc.data().href}/embed?autoPlay=false&mutePlay=false&showChat=false`
      }));

      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      return {
        docs,
        lastDoc: lastVisible,
        hasMore: docs.length === pageSize
      };
    } catch (error) {
      console.error('페이지네이션 데이터 fetch 실패:', error);
      throw error;
    }
  }

  // 특정 기간 데이터만 가져오기
  async fetchScrapedLinksByDateRange(startDate, endDate) {
    const cacheKey = this.getCacheKey('scraped_links', `${startDate}_${endDate}`);
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, "scraped_links"),
          orderBy("uploadedDate", "asc")
        )
      );
      
      const docs = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(doc => doc.uploadedDate >= startDate && doc.uploadedDate <= endDate)
        .map(doc => ({
          iframeUrl: `${doc.href}/embed?autoPlay=false&mutePlay=false&showChat=false`, 
          ...doc
        }));

      // 캐시 저장
      this.cache.set(cacheKey, {
        data: docs,
        timestamp: Date.now()
      });

      return docs;
    } catch (error) {
      console.error('날짜 범위 데이터 fetch 실패:', error);
      throw error;
    }
  }

  // 캐시 무효화
  invalidateCache(cacheKey = null) {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  // 캐시 정리 (오래된 캐시 삭제)
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
}

// 싱글톤 인스턴스
export const firebaseService = new FirebaseService();

// 정기적으로 캐시 정리 (5분마다)
setInterval(() => {
  firebaseService.cleanupCache();
}, 5 * 60 * 1000);