// BoxAnimation.tsx
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const BoxAnimation: React.FC = () => {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Анимация после монтирования компонента
    gsap.to(boxRef.current, {
      duration: 2,
      x: 100,
      ease: "power2.out"
    });
  }, []); // Пустой массив зависимостей - анимация только при первом рендере

  return (
    <div
      ref={boxRef}
      style={{
        width: '100px',
        height: '100px',
        backgroundColor: '#3498db',
        borderRadius: '5px'
      }}
    />
  );
};

export default BoxAnimation;