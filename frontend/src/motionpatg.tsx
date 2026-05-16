// ArrayPathAnimation.tsx
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(MotionPathPlugin);

const ArrayPathAnimation: React.FC = () => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      // Массив точек пути
      const pathPoints = [
        { x: 100, y: 200 },
        { x: 200, y: 100 },
        { x: 300, y: 150 },
        { x: 400, y: 50 },
        { x: 500, y: 150 },
        { x: 600, y: 100 },
        { x: 700, y: 200 },
        { x: 600, y: 300 },
        { x: 500, y: 250 },
        { x: 400, y: 350 },
        { x: 300, y: 300 },
        { x: 200, y: 350 },
        { x: 100, y: 200 }
      ];

      gsap.to(elementRef.current, {
        duration: 6,
        repeat: -1,
        ease: "power1.inOut",
        motionPath: {
          path: pathPoints,
          autoRotate: true,
          curviness: 1.5,
          alignOrigin: [0.5, 0.5]
        }
      });
    }
  }, []);

  return (
    <div style={{ position: 'relative', width: '800px', height: '600px', border: '1px solid #ccc', margin: '20px' }}>
      {/* Рисуем путь из точек */}
      <svg width="100%" height="100%" viewBox="0 0 800 600">
        <polyline
          points="100,200 200,100 300,150 400,50 500,150 600,100 700,200 600,300 500,250 400,350 300,300 200,350 100,200"
          fill="none"
          stroke="#3498db"
          strokeWidth="2"
          strokeDasharray="4,4"
        />
        {/* Отмечаем узловые точки */}
        {[
          [100, 200], [200, 100], [300, 150], [400, 50],
          [500, 150], [600, 100], [700, 200], [600, 300],
          [500, 250], [400, 350], [300, 300], [200, 350]
        ].map((point, index) => (
          <circle
            key={index}
            cx={point[0]}
            cy={point[1]}
            r="3"
            fill="#e74c3c"
          />
        ))}
      </svg>
      
      <div
        ref={elementRef}
        style={{
          width: '20px',
          height: '20px',
          backgroundColor: '#e74c3c',
          borderRadius: '50%',
          position: 'absolute',
          top: 0,
          left: 0,
          boxShadow: '0 0 5px rgba(0,0,0,0.5)'
        }}
      />
      
      <div style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.8)', padding: '5px', borderRadius: '5px', fontSize: '12px' }}>
        🎯 Движение по заданным точкам
      </div>
    </div>
  );
};

export default ArrayPathAnimation;