// services/firebaseService.js
import { db } from "../lib/firebaseConfig";
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  limit, 
  startAfter
} from "firebase/firestore";

// Realtime Database import 추가
import { 
  ref, 
  get, 
  set, 
  increment, 
  serverTimestamp, 
  onValue, 
  getDatabase 
} from "firebase/database";

class FirebaseService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10분
  }

  // 캐시 키 생성
  getCacheKey(collectionName, orderField, limitValue = null) {
    return `${collectionName}_${orderField}_${limitValue}`;
  }

  // 캐시 유효성 검사 (커스텀 타임아웃 지원)
  isCacheValid(cacheKey, customTimeout = null) {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    const timeout = customTimeout || this.cacheTimeout;
    return (Date.now() - cached.timestamp) < timeout;
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

  // =========================================
  // 방문자 카운트 관련 메서드들 (Realtime Database 사용)
  // =========================================

  // 오늘 날짜를 YYYY-MM-DD 형식으로 반환
  getTodayString() {
    return new Date().toLocaleDateString('ko-CA');
  }

  // 방문자 카운트 증가 (중복 방지)
  async incrementVisitorCount() {
    try {
      const today = this.getFirebaseSafeDateString();
      const sessionKey = `visited_${today}`;
      
      
      // 오늘 이미 방문했는지 확인 (sessionStorage 사용)
      const hasVisitedToday = sessionStorage.getItem(sessionKey);
      
      if (!hasVisitedToday) {
        const realtimeDb = getDatabase();
        
        // 총 방문자 수 증가
        const totalRef = ref(realtimeDb, 'visitors/total');
        await set(totalRef, increment(1));
        
        // 오늘 방문자 수 증가
        const todayRef = ref(realtimeDb, `visitors/daily/${today}`);
        await set(todayRef, increment(1));
        
        // 마지막 업데이트 시간 기록
        const lastUpdateRef = ref(realtimeDb, 'visitors/lastUpdate');
        await set(lastUpdateRef, serverTimestamp());
        
        // 세션에 방문 기록 저장
        sessionStorage.setItem(sessionKey, 'true');
        
        console.log('방문자 카운트가 증가되었습니다.');
        
        // 방문자 통계 캐시 무효화
        this.invalidateCache('visitor_stats');
      }
    } catch (error) {
      console.error('방문자 카운트 증가 실패:', error);
    }
  }

  // 방문자 통계 가져오기
  async getVisitorStats() {
    const cacheKey = 'visitor_stats';
    
    // 캐시 확인 (1분 캐시)
    if (this.isCacheValid(cacheKey, 60 * 1000)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const realtimeDb = getDatabase();
      const today = this.getFirebaseSafeDateString();

      // 총 방문자 수 가져오기
      const totalRef = ref(realtimeDb, 'visitors/total');
      const totalSnapshot = await get(totalRef);
      const totalCount = totalSnapshot.exists() ? totalSnapshot.val() : 0;
      
      // 오늘 방문자 수 가져오기
      const todayRef = ref(realtimeDb, `visitors/daily/${today}`);
      const todaySnapshot = await get(todayRef);
      const todayCount = todaySnapshot.exists() ? todaySnapshot.val() : 0;
      
      const stats = {
        total: totalCount,
        today: todayCount
      };

      // 캐시 저장
      this.cache.set(cacheKey, {
        data: stats,
        timestamp: Date.now()
      });
      
      return stats;
    } catch (error) {
      console.error('방문자 통계 가져오기 실패:', error);
      return {
        total: 0,
        today: 0
      };
    }
  }

  // 실시간 방문자 통계 구독
  subscribeToVisitorStats(callback) {
    try {
      const realtimeDb = getDatabase();
      const today = this.getFirebaseSafeDateString();
      
      // 총 방문자 수 실시간 구독
      const totalRef = ref(realtimeDb, 'visitors/total');
      const todayRef = ref(realtimeDb, `visitors/daily/${today}`);
      
      const unsubscribeTotal = onValue(totalRef, (snapshot) => {
        const total = snapshot.exists() ? snapshot.val() : 0;
        
        // 오늘 방문자 수도 함께 가져오기
        get(todayRef).then((todaySnapshot) => {
          const today = todaySnapshot.exists() ? todaySnapshot.val() : 0;
          callback({ total, today });
        });
      });
      
      return unsubscribeTotal;
    } catch (error) {
      console.error('방문자 통계 구독 실패:', error);
      return () => {}; // 빈 구독 해제 함수 반환
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
  getFirebaseSafeDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
}


// 싱글톤 인스턴스
export const firebaseService = new FirebaseService();

// 정기적으로 캐시 정리 (5분마다)
setInterval(() => {
  firebaseService.cleanupCache();
}, 5 * 60 * 1000);