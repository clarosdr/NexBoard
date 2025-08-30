import { useState, useEffect, useRef } from 'react';

// Hook personalizado para manejar gestos táctiles
export const useTouchGestures = ({
  onSwipeLeft,
  onSwipeRight,
  onPullToRefresh,
  swipeThreshold = 50,
  pullThreshold = 100
} = {}) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const elementRef = useRef(null);

  // Detectar inicio del toque
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  // Detectar movimiento del toque
  const handleTouchMove = (e) => {
    if (!touchStart) return;

    const currentTouch = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };

    setTouchEnd(currentTouch);

    // Detectar pull-to-refresh (solo si estamos en la parte superior)
    if (onPullToRefresh && elementRef.current) {
      const scrollTop = elementRef.current.scrollTop || window.pageYOffset;
      const deltaY = currentTouch.y - touchStart.y;
      
      if (scrollTop === 0 && deltaY > 0) {
        e.preventDefault();
        setIsPulling(true);
        setPullDistance(Math.min(deltaY, pullThreshold * 1.5));
      }
    }
  };

  // Detectar fin del toque
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Detectar swipe horizontal (solo si el movimiento horizontal es mayor que el vertical)
    if (absDeltaX > absDeltaY && absDeltaX > swipeThreshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    // Detectar pull-to-refresh
    if (isPulling && pullDistance >= pullThreshold && onPullToRefresh) {
      onPullToRefresh();
    }

    // Reset states
    setTouchStart(null);
    setTouchEnd(null);
    setIsPulling(false);
    setPullDistance(0);
  };

  // Propiedades para el elemento que manejará los gestos
  const touchHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    ref: elementRef
  };

  return {
    touchHandlers,
    isPulling,
    pullDistance,
    pullProgress: Math.min(pullDistance / pullThreshold, 1)
  };
};

// Hook para swipe en cards individuales
export const useSwipeCard = ({ onSwipeLeft, onSwipeRight, threshold = 100 }) => {
  const [touchStart, setTouchStart] = useState(null);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef(null);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!touchStart || !isDragging) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;
    setCurrentX(diff);

    // Aplicar transformación visual
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${diff}px)`;
      cardRef.current.style.opacity = Math.max(0.5, 1 - Math.abs(diff) / 200);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !isDragging) return;

    const absDiff = Math.abs(currentX);
    
    if (absDiff > threshold) {
      if (currentX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (currentX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    // Reset visual state
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateX(0)';
      cardRef.current.style.opacity = '1';
    }

    setTouchStart(null);
    setCurrentX(0);
    setIsDragging(false);
  };

  const swipeHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    ref: cardRef
  };

  return {
    swipeHandlers,
    isDragging,
    currentX
  };
};

export default useTouchGestures;