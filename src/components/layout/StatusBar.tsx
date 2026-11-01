import React, { useState, useEffect } from 'react';
import { Timer, Flame, Check, History, Play, Pause, RotateCcw } from 'lucide-react';

interface StatusBarProps {
  sceneWordCount: number;
  sessionWordDelta: number;
  streakDays: number;
  lastSnapshotText: string;
  isSaving?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  sceneWordCount,
  sessionWordDelta,
  streakDays,
  lastSnapshotText,
  isSaving = false,
}) => {
  // 25-minute Pomodoro timer
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <footer style={{
      height: '32px',
      borderTop: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      backgroundColor: 'var(--bg-app)',
      fontSize: '12px',
      color: 'var(--text-secondary)',
      userSelect: 'none',
      zIndex: 10,
    }}>
      {/* Left side: Word Counts & Session Metrics */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
          {sceneWordCount.toLocaleString()} words
        </div>
        <div style={{ color: 'var(--text-muted)' }}>•</div>
        <div style={{ color: 'var(--accent-secondary)', fontWeight: 500 }}>
          Session +{sessionWordDelta.toLocaleString()}
        </div>
        <div style={{ color: 'var(--text-muted)' }}>•</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
          <Flame size={13} color="var(--accent-secondary)" />
          <span>Streak {streakDays} days</span>
        </div>
      </div>

      {/* Right side: Save/Snapshot Status & Pomodoro */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
          <History size={13} />
          <span>{isSaving ? 'Saving...' : `Saved • ${lastSnapshotText}`}</span>
        </div>

        <div style={{ color: 'var(--text-muted)' }}>|</div>

        {/* Pomodoro Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Timer size={13} color="var(--text-secondary)" />
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--text-primary)' }}>
            Pomodoro {formatTimer(secondsLeft)}
          </span>
          <button
            onClick={() => setIsRunning(!isRunning)}
            title={isRunning ? 'Pause Pomodoro' : 'Start Pomodoro'}
            style={{
              padding: '2px 4px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-active)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {isRunning ? <Pause size={10} /> : <Play size={10} />}
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(25 * 60);
            }}
            title="Reset Pomodoro"
            style={{
              padding: '2px 4px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-active)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={10} />
          </button>
        </div>
      </div>
    </footer>
  );
};
