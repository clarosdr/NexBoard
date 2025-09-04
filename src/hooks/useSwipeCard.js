import { useState, useCallback } from 'react';

const useSwipeCard = ({ onSwipeLeft, onSwipeRight, threshold = 100 }) => {
  const [isSwiping, setIsSwiping] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [swipeTranslateX, setSwipeTranslateX] = useState(0);

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
    setSwipeTranslateX(0);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    const deltaX = e.touches[0].clientX - startX;
    setSwipeTranslateX(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;

    if (swipeTranslateX > threshold) {
      onSwipeRight && onSwipeRight();
    } else if (swipeTranslateX < -threshold) {
      onSwipeLeft && onSwipeLeft();
    }
    
    setSwipeTranslateX(0);
    setIsSwiping(false);
  };
  
    const handleMouseDown = (e) => {
    setStartX(e.clientX);
    setIsSwiping(true);
    setSwipeTranslateX(0);
    
    const handleMouseMove = (e) => {
      if (!isSwiping) return;
      const deltaX = e.clientX - startX;
      setSwipeTranslateX(deltaX);
    };

    const handleMouseUp = () => {
      if (!isSwiping) return;

      if (swipeTranslateX > threshold) {
        onSwipeRight && onSwipeRight();
      } else if (swipeTranslateX < -threshold) {
        onSwipeLeft && onSwipeLeft();
      }
      
      setSwipeTranslateX(0);
      setIsSwiping(false);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };


  const swipeHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleMouseDown,
  };

  return {
    swipeHandlers,
    isSwiping,
    swipeTranslateX,
  };
};

export default useSwipeCard;