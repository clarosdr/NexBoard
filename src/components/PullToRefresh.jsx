import React from 'react';
import { useTouchGestures } from '../hooks/useTouchGestures';

const PullToRefresh = ({ onRefresh, children, disabled = false }) => {
  const { touchHandlers, isPulling, pullDistance, pullProgress } = useTouchGestures({
    onPullToRefresh: disabled ? null : onRefresh,
    pullThreshold: 80
  });

  return (
    <div className="relative overflow-hidden" {...touchHandlers}>
      {/* Indicador de Pull to Refresh */}
      {isPulling && (
        <div 
          className="absolute top-0 left-0 right-0 bg-blue-50 border-b border-blue-200 transition-all duration-200 ease-out z-10"
          style={{ 
            height: `${Math.min(pullDistance, 80)}px`,
            transform: `translateY(-${Math.max(0, 80 - pullDistance)}px)`
          }}
        >
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2 text-blue-600">
              <div 
                className={`transition-transform duration-200 ${
                  pullProgress >= 1 ? 'animate-spin' : ''
                }`}
                style={{
                  transform: `rotate(${pullProgress * 180}deg)`
                }}
              >
                {pullProgress >= 1 ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium">
                {pullProgress >= 1 ? 'Suelta para actualizar' : 'Desliza hacia abajo'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Contenido */}
      <div className={isPulling ? 'transition-transform duration-200' : ''}>
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;