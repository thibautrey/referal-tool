"use client";
import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ContainerScrollProps {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
}

export function ContainerScroll({
  titleComponent,
  children,
}: ContainerScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 1] : [1.05, 1];
  };

  const imageScale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const imageOpacity = useTransform(scrollYProgress, [0, 0.5, 0.6], [0, 1, 1]);
  const titleScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.85]);
  const titleTranslateY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  return (
    <div
      ref={containerRef}
      className="relative h-[140vh] py-16 overflow-hidden antialiased"
    >
      <div className="sticky top-0 flex items-center justify-center h-screen">
        <motion.div
          style={{
            scale: titleScale,
            y: titleTranslateY,
          }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center"
        >
          {titleComponent}
        </motion.div>

        <motion.div
          style={{
            scale: imageScale,
            opacity: imageOpacity,
          }}
          className="relative w-full h-full max-w-5xl mx-auto"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
