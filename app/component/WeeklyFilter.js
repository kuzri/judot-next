import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WeeklyFilter = ({ onWeekChange, initialWeekRange }) => {
  // 오늘 날짜를 기준으로 현재 주의 시작일과 끝일 계산
  const getWeekRange = (date) => {
    const current = new Date(date);
    const day = current.getDay(); // 0: 일요일, 1: 월요일, ...
    
    // 월요일을 주의 시작으로 설정 (day === 0이면 일요일이므로 -6으로 조정)
    const mondayOffset = day === 0 ? -6 : 1 - day;
    
    const monday = new Date(current);
    monday.setDate(current.getDate() + mondayOffset);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return { start: monday, end: sunday };
  };

  // 현재 주 (오늘이 포함된 주) 계산
  const getCurrentWeek = () => {
    const today = new Date();
    return getWeekRange(today);
  };

  // initialWeekRange를 Date 객체로 변환하는 함수
  const stringToDateRange = (range) => {
    if (!range || !range.start || !range.end) {
      return getCurrentWeek();
    }
    return {
      start: new Date(range.start),
      end: new Date(range.end)
    };
  };

  const [currentWeek, setCurrentWeek] = useState(() => {
    return initialWeekRange ? stringToDateRange(initialWeekRange) : getCurrentWeek();
  });

  // initialWeekRange가 변경될 때 currentWeek 업데이트
  useEffect(() => {
    if (initialWeekRange) {
      const newWeek = stringToDateRange(initialWeekRange);
      setCurrentWeek(newWeek);
    }
  }, [initialWeekRange]);

  // 오늘이 포함된 주 정보
  const thisWeek = getCurrentWeek();

  // 날짜를 yyyy-MM-dd 형태로 변환
  const formatDateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 두 주가 같은 주인지 비교
  const isSameWeek = (week1, week2) => {
    return formatDateToString(week1.start) === formatDateToString(week2.start) &&
           formatDateToString(week1.end) === formatDateToString(week2.end);
  };

  // 현재 선택된 주가 이번 주(오늘이 포함된 주)인지 확인
  const isCurrentWeekSelected = () => {
    return isSameWeek(currentWeek, thisWeek);
  };

  // 다음 주 버튼이 비활성화되어야 하는지 확인
  const isNextWeekDisabled = () => {
    const nextWeekStart = new Date(currentWeek.start);
    nextWeekStart.setDate(currentWeek.start.getDate() + 7);
    const nextWeek = getWeekRange(nextWeekStart);
    
    // 다음 주가 현재 주(오늘이 포함된 주)보다 미래인지 확인
    return nextWeek.start > thisWeek.start;
  };

  // 이전 주로 이동
  const goToPreviousWeek = () => {
    const prevWeekStart = new Date(currentWeek.start);
    prevWeekStart.setDate(currentWeek.start.getDate() - 7);
    const newWeek = getWeekRange(prevWeekStart);
    setCurrentWeek(newWeek);
    if (onWeekChange) {
      onWeekChange({
        start: formatDateToString(newWeek.start),
        end: formatDateToString(newWeek.end)
      });
    }
  };

  // 다음 주로 이동
  const goToNextWeek = () => {
    if (isNextWeekDisabled()) return;
    
    const nextWeekStart = new Date(currentWeek.start);
    nextWeekStart.setDate(currentWeek.start.getDate() + 7);
    const newWeek = getWeekRange(nextWeekStart);
    setCurrentWeek(newWeek);
    if (onWeekChange) {
      onWeekChange({
        start: formatDateToString(newWeek.start),
        end: formatDateToString(newWeek.end)
      });
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
  };

  // 컴포넌트 마운트 시 초기 데이터 전송
  useEffect(() => {
    if (onWeekChange) {
      onWeekChange({
        start: formatDateToString(currentWeek.start),
        end: formatDateToString(currentWeek.end)
      });
    }
  }, []);

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={goToPreviousWeek}
        className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        이전 주
      </button>

      <div className={`text-center px-4 py-2 rounded-lg transition-all ${'bg-blue-50 border-2 border-blue-200 text-blue-800' }`}> 
        <span className="text-sm font-medium">
          {formatDate(currentWeek.start)} ~ {formatDate(currentWeek.end)}
        </span>
        {isCurrentWeekSelected() && (
          <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full ">
            이번 주
          </span>
        )}
      </div>

      <button
        onClick={goToNextWeek}
        disabled={isNextWeekDisabled()}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
          isNextWeekDisabled()
            ? 'text-gray-400 cursor-not-allowed opacity-50'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer'
        }`}
      >
        다음 주
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default WeeklyFilter;