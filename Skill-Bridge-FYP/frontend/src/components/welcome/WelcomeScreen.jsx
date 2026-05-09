import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './WelcomeScreen.css';

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 30;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => setLoading(false), 500);
          return 100;
        }
        return Math.min(next, 100);
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    }
  }, [loading, navigate]);

  return (
    <div className="welcome-container">
      {/* Animated background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <motion.div
        className="welcome-content"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Animated Logo */}
        <motion.div
          className="logo-container"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg
            viewBox="0 0 200 200"
            className="skill-bridge-logo"
            width="120"
            height="120"
          >
            {/* Gears */}
            <g className="gear gear-1">
              <circle cx="60" cy="70" r="35" fill="none" stroke="url(#purpleGradient)" strokeWidth="8" />
              <circle cx="60" cy="70" r="28" fill="none" stroke="url(#purpleGradient)" strokeWidth="2" opacity="0.5" />
              {/* Gear teeth */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30) * (Math.PI / 180);
                const x1 = 60 + 38 * Math.cos(angle);
                const y1 = 70 + 38 * Math.sin(angle);
                const x2 = 60 + 44 * Math.cos(angle);
                const y2 = 70 + 44 * Math.sin(angle);
                return (
                  <line
                    key={`tooth-1-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="url(#purpleGradient)"
                    strokeWidth="3"
                  />
                );
              })}
            </g>

            <g className="gear gear-2">
              <circle cx="130" cy="100" r="40" fill="none" stroke="url(#cyanGradient)" strokeWidth="8" />
              <circle cx="130" cy="100" r="32" fill="none" stroke="url(#cyanGradient)" strokeWidth="2" opacity="0.5" />
              {/* Gear teeth */}
              {Array.from({ length: 14 }).map((_, i) => {
                const angle = (i * (360 / 14)) * (Math.PI / 180);
                const x1 = 130 + 43 * Math.cos(angle);
                const y1 = 100 + 43 * Math.sin(angle);
                const x2 = 130 + 50 * Math.cos(angle);
                const y2 = 100 + 50 * Math.sin(angle);
                return (
                  <line
                    key={`tooth-2-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="url(#cyanGradient)"
                    strokeWidth="3"
                  />
                );
              })}
            </g>

            {/* Eye */}
            <circle cx="100" cy="70" r="15" fill="none" stroke="url(#purpleGradient)" strokeWidth="3" />
            <circle cx="100" cy="70" r="8" fill="url(#purpleGradient)" opacity="0.7" />

            {/* Bridge */}
            <path
              d="M 70 50 Q 100 30 130 50"
              fill="none"
              stroke="url(#cyanGradient)"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Gradients */}
            <defs>
              <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#c4b5fd" />
              </linearGradient>
              <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Title and Subtitle */}
        <motion.h1
          className="title glow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          SKILL BRIDGE
        </motion.h1>
        <motion.p
          className="subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Connecting Skills, Building Futures
        </motion.p>

        {/* Loading Progress */}
        {loading && (
          <motion.div
            className="loading-section"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="progress-container">
              <div className="progress-bar-outer">
                <div
                  className="progress-bar-inner"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
              <div className="progress-text">
                <span className="progress-number">{Math.ceil(Math.min(progress, 100))}%</span>
              </div>
            </div>
            <p className="loading-text">LOADING ASSETS... PLEASE WAIT</p>
          </motion.div>
        )}

        {/* Floating Stars */}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="floating-star"
            animate={{
              y: [0, -20, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            style={{
              left: `${10 + i * 20}%`,
              top: `${20 + i * 15}%`,
            }}
          >
            ✨
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
