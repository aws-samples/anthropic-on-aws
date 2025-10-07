import React from 'react';
import styles from '../styles/ThinkingDots.module.css';

const ThinkingDots: React.FC = () => {
  return (
    <div className={styles.thinkingDotsContainer}>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
    </div>
  );
};

export default ThinkingDots;
