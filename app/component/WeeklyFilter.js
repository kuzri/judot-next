import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WeeklyFilter = ({ onWeekChange }) => {
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

  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    return getWeekRange(today);
  });

  // 날짜를 yyyy-MM-dd 형태로 변환
  const formatDateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={goToPreviousWeek}
        className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        이전 주
      </button>

      <div className="text-center">
        <span className="text-sm font-medium text-gray-700">
          {formatDate(currentWeek.start)} ~ {formatDate(currentWeek.end)}
        </span>
      </div>

      <button
        onClick={goToNextWeek}
        className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      >
        다음 주
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default WeeklyFilter;