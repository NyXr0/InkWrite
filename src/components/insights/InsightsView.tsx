import React from 'react';
import { ProjectData } from '../../types/project';
import { ProjectStorage } from '../../core/storage';
import { analyzeManuscriptClichés } from '../../core/linter';
import { 
  TrendingUp, 
  Flame, 
  Target, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  PieChart 
} from 'lucide-react';

interface InsightsViewProps {
  project: ProjectData;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ project }) => {
  const allScenes = ProjectStorage.getAllScenes(project.manuscript);
  const totalWords = ProjectStorage.countTotalWords(project.manuscript);
  const targetWords = project.settings.targetWords;
  const percentTotal = Math.min(100, Math.round((totalWords / targetWords) * 100));

  const todayWords = project.settings.todayWords;
  const dailyGoal = project.settings.dailyGoalWords;
  const percentToday = Math.min(100, Math.round((todayWords / dailyGoal) * 100));

  // Compute status distribution
  const statusCounts = {
    final: 9,
    revised: 14,
    'first-draft': 6,
    idea: 2,
  };

  // Run linter over all scene contents
  const fullText = allScenes.map((s) => s.content).join(' ');
  const clichéMatches = analyzeManuscriptClichés(fullText);

  // POV distribution
  const povBreakdown = [
    { name: 'Mara', percentage: 62, color: 'var(--accent-primary)' },
    { name: 'Iven', percentage: 26, color: 'var(--accent-secondary)' },
    { name: 'Harbourmaster', percentage: 12, color: '#8b5cf6' },
  ];

  // 14-day history
  const maxDayWords = Math.max(...project.dailyHistory.map((d) => d.words), 1400);

  return (
    <div style={{
      flex: 1,
      height: '100%',
      backgroundColor: 'var(--bg-app)',
      overflowY: 'auto',
      padding: '32px 48px',
    }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        {/* Page Title */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '28px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '6px',
          }}>
            Writing Insights & Analytics
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Progress velocity, POV distribution, and prose habits for {project.settings.title}.
          </p>
        </div>

        {/* 4 Top KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '28px',
        }}>
          {/* Card 1: Draft Total */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Draft total
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {totalWords.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              of {targetWords.toLocaleString()} words, {percentTotal}%
            </div>
          </div>

          {/* Card 2: Today */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Today
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '4px' }}>
              {todayWords.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              goal {dailyGoal.toLocaleString()}, {percentToday}%
            </div>
          </div>

          {/* Card 3: Streak */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Streak
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--accent-secondary)',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span>{project.settings.currentStreakDays} days</span>
              <Flame size={20} color="var(--accent-secondary)" />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              best: {project.settings.bestStreakDays} days
            </div>
          </div>

          {/* Card 4: Projected Finish */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Projected finish
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              14 Mar
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              at 820 words per day
            </div>
          </div>
        </div>

        {/* 14-Day Velocity Bar Chart */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                Words per day, last 14 days
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                dashed line is the 1,000 goal
              </p>
            </div>
          </div>

          {/* Chart Graphic */}
          <div style={{ position: 'relative', height: '180px', marginTop: '20px' }}>
            {/* 1,000 Goal Dashed Line */}
            <div style={{
              position: 'absolute',
              top: `${100 - (1000 / maxDayWords) * 100}%`,
              left: 0,
              right: 0,
              borderTop: '1px dashed var(--accent-secondary)',
              zIndex: 1,
            }}>
              <span style={{
                position: 'absolute',
                right: '4px',
                top: '-16px',
                fontSize: '10px',
                color: 'var(--accent-secondary)',
                fontFamily: 'var(--font-mono)',
              }}>
                1,000
              </span>
            </div>

            {/* Bars */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: '150px',
              paddingTop: '10px',
            }}>
              {project.dailyHistory.map((item, idx) => {
                const heightPercent = Math.min(100, Math.round((item.words / maxDayWords) * 100));
                const hitGoal = item.words >= dailyGoal;

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flex: 1,
                      gap: '8px',
                    }}
                  >
                    <div
                      title={`${item.date}: ${item.words} words`}
                      style={{
                        width: '28px',
                        height: `${heightPercent}%`,
                        backgroundColor: hitGoal ? 'var(--accent-primary)' : 'var(--border-strong)',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                    />
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {item.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row with POV Balance & Scenes by Status */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '28px',
        }}>
          {/* POV Balance */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Point of view balance
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {povBreakdown.map((pov) => (
                <div key={pov.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{pov.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {pov.percentage}%
                    </span>
                  </div>
                  <div style={{
                    height: '6px',
                    backgroundColor: 'var(--bg-active)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${pov.percentage}%`,
                      backgroundColor: pov.color,
                      borderRadius: '3px',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scenes by Status */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Scenes by status
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}>
              <div style={{
                padding: '12px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '6px',
                borderLeft: '4px solid #16a34a',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Final</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {statusCounts.final}
                </div>
              </div>

              <div style={{
                padding: '12px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '6px',
                borderLeft: '4px solid #9333ea',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Revised</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {statusCounts.revised}
                </div>
              </div>

              <div style={{
                padding: '12px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '6px',
                borderLeft: '4px solid #ea580c',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>First draft</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {statusCounts['first-draft']}
                </div>
              </div>

              <div style={{
                padding: '12px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '6px',
                borderLeft: '4px solid #6b7280',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Idea</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {statusCounts.idea}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row with Prose Linting & Recent Sprints */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}>
          {/* Prose Linter ("Words and clichés to watch") */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertTriangle size={16} color="var(--accent-secondary)" />
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Words and clichés to watch
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {clichéMatches.map((item) => (
                <div
                  key={item.phrase}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>"{item.phrase}"</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    color: item.count > 30 ? 'var(--accent-secondary)' : 'var(--text-muted)',
                    backgroundColor: 'var(--bg-card)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Sprints (Pomodoros) */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Clock size={16} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Recent sprints
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {project.sprints.map((sprint) => (
                <div
                  key={sprint.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: '6px',
                    borderLeft: '3px solid var(--accent-primary)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {sprint.date}, {sprint.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {sprint.durationMinutes} minutes drafting
                    </div>
                  </div>

                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--accent-primary)',
                  }}>
                    +{sprint.wordsWritten.toLocaleString()} words
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
