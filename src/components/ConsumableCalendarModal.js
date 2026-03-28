import React, { useMemo, useState } from 'react';
import { useRice } from '../context/RiceContext';
import './CalendarModal.css';

const ConsumableCalendarModal = ({ consumable, onClose, onEdit }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { purchaseRecords, buyConsumable, refundConsumable } = useRice();

  // 获取该消耗品的购买记录日期
  const purchaseDates = useMemo(() => {
    return purchaseRecords
      .filter(r => r.consumableId === consumable.id)
      .map(r => r.purchaseDate ? r.purchaseDate.slice(0, 10) : r.purchaseDate)
      .filter(Boolean);
  }, [purchaseRecords, consumable.id]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 7 : day;
  };

  const toLocalISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isDatePurchased = (date) => {
    const dateStr = toLocalISO(date);
    return purchaseDates.includes(dateStr);
  };

  const handleDayClick = async (dayISO, isPurchased) => {
    if (isPurchased) {
      // 已购买，点击退还米粒
      try {
        await refundConsumable(consumable.id, dayISO);
      } catch (e) {
        // 已在 context 打印错误
      }
    } else {
      // 未购买，点击消耗米粒
      try {
        await buyConsumable(consumable.id, dayISO);
      } catch (e) {
        // 已在 context 打印错误
      }
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const todayISO = toLocalISO(new Date());

    for (let i = 1; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isPurchased = isDatePurchased(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const dayISO = toLocalISO(date);
      const isFuture = dayISO > todayISO;

      days.push(
        <div
          key={day}
          className={`calendar-day ${isPurchased ? 'completed' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}`}
          onClick={() => {
            if (isFuture) return;
            handleDayClick(dayISO, isPurchased);
          }}
          role="button"
          tabIndex={isFuture ? -1 : 0}
          onKeyDown={(e) => {
            if (isFuture) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleDayClick(dayISO, isPurchased);
            }
          }}
        >
          {isPurchased ? (
            <span className="day-mark">✓</span>
          ) : (
            <span className="day-number">{day}</span>
          )}
        </div>
      );
    }

    return days;
  };

  const changeMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  const monthStats = useMemo(() => {
    const month = currentMonth.getMonth() + 1;
    const year = currentMonth.getFullYear();
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthlyPurchases = purchaseDates.filter(dateStr => dateStr && dateStr.startsWith(prefix)).length;
    const daysInMonth = getDaysInMonth(currentMonth);
    const monthlyRate = daysInMonth > 0 ? Math.round((monthlyPurchases / daysInMonth) * 100) : 0;
    const monthlyRice = monthlyPurchases * ((consumable?.cost) || 0);
    return { monthlyPurchases, monthlyRate, monthlyRice };
  }, [purchaseDates, consumable, currentMonth]);

  if (!consumable) return null;

  return (
    <div className="calendar-modal-overlay" onClick={onClose}>
      <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="calendar-header">
          <button className="nav-button" onClick={() => changeMonth(-1)}>‹</button>
          <h3 className="calendar-title">
            {consumable.name} - {currentMonth.getFullYear()}年{monthNames[currentMonth.getMonth()]}
          </h3>
          <button className="nav-button" onClick={() => changeMonth(1)}>›</button>
        </div>

        <div className="calendar-weekdays">
          {weekDays.map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {renderCalendarDays()}
        </div>

        <div className="calendar-stats">
          <div className="stat-item">
            <span className="stat-label">本月购买</span>
            <span className="stat-value">{monthStats.monthlyPurchases}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">总购买</span>
            <span className="stat-value">{purchaseDates.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">本月购买率</span>
            <span className="stat-value">{monthStats.monthlyRate}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">本月消耗</span>
            <span className="stat-value">{monthStats.monthlyRice}</span>
          </div>
        </div>

        <div className="button-group">
          <button className="modal-close-btn" onClick={onClose}>关闭</button>
          <button className="modal-edit-btn" onClick={onEdit}>编辑</button>
        </div>
      </div>
    </div>
  );
};

export default ConsumableCalendarModal;
