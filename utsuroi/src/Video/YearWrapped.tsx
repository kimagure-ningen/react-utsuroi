import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from 'remotion';
import { useEffect, useState } from 'react';
import { YearStats } from '../types';

// カラーパレット
const colors = {
  primary: '#6366f1', // インディゴ
  secondary: '#a855f7', // パープル
  accent: '#ec4899', // ピンク
  success: '#10b981', // グリーン
  warning: '#f59e0b', // アンバー
  background: {
    start: '#0f172a', // ダークブルー
    end: '#1e293b', // スレートグレー
  },
  text: {
    primary: '#ffffff',
    secondary: '#cbd5e1',
  },
};

// デフォルトデータ
const defaultStats: YearStats = {
  totalEvents: 0,
  busiestMonth: { month: '未取得', count: 0 },
  topLocations: [],
  topAttendees: [],
  eventsByMonth: {},
};

// パーティクルコンポーネント
const Particle: React.FC<{ frame: number; index: number; total: number }> = ({ frame, index, total }) => {
  const delay = (index / total) * 30;
  const duration = 90 + (index % 3) * 30;
  const startY = -100 - (index % 5) * 50;
  const endY = 1180;
  const startX = (index / total) * 1920;
  const wobble = Math.sin((frame + delay) * 0.1) * 30;

  const y = interpolate(
    frame,
    [delay, delay + duration],
    [startY, endY],
    { extrapolateRight: 'clamp' }
  );

  const rotation = interpolate(
    frame,
    [delay, delay + duration],
    [0, 360 * 2],
    { extrapolateRight: 'clamp' }
  );

  const opacity = interpolate(
    frame,
    [delay, delay + 20, delay + duration - 20, delay + duration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const particleColors = [colors.primary, colors.secondary, colors.accent, colors.success, colors.warning];
  const color = particleColors[index % particleColors.length];

  return (
    <div
      style={{
        position: 'absolute',
        left: startX + wobble,
        top: y,
        width: '20px',
        height: '20px',
        background: color,
        borderRadius: index % 2 === 0 ? '50%' : '0%',
        transform: `rotate(${rotation}deg)`,
        opacity,
        boxShadow: `0 0 20px ${color}`,
      }}
    />
  );
};

// パーティクルシステム
const ParticleSystem: React.FC<{ frame: number; count?: number }> = ({ frame, count = 50 }) => {
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: count }).map((_, i) => (
        <Particle key={i} frame={frame} index={i} total={count} />
      ))}
    </AbsoluteFill>
  );
};

// アニメーション付き背景コンポーネント（パララックス効果）
const AnimatedBackground: React.FC<{ frame: number }> = ({ frame }) => {
  const rotation = interpolate(frame, [0, 660], [0, 720]);
  const scale = interpolate(frame % 60, [0, 30, 60], [1, 1.1, 1]);

  // パララックス用の異なる速度
  const slowRotation = interpolate(frame, [0, 660], [0, 360]);
  const fastRotation = interpolate(frame, [0, 660], [0, 1080]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.background.start} 0%, ${colors.background.end} 100%)`,
        overflow: 'hidden',
      }}
    >
      {/* 背景レイヤー1（最も遅い） */}
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          right: '-20%',
          width: '1000px',
          height: '1000px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.primary}15 0%, transparent 70%)`,
          transform: `rotate(${slowRotation}deg) scale(${scale})`,
          opacity: 0.4,
        }}
      />

      {/* 背景レイヤー2（中速） */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.primary}20 0%, transparent 70%)`,
          transform: `rotate(${rotation}deg) scale(${scale})`,
          opacity: 0.3,
        }}
      />

      {/* 背景レイヤー3（速い） */}
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.secondary}20 0%, transparent 70%)`,
          transform: `rotate(${-fastRotation}deg) scale(${scale})`,
          opacity: 0.3,
        }}
      />

      {/* 追加の装飾レイヤー */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.accent}10 0%, transparent 70%)`,
          transform: `translate(-50%, -50%) rotate(${rotation * 0.5}deg)`,
          opacity: 0.2,
        }}
      />
    </AbsoluteFill>
  );
};

// カウントアップアニメーション用のヘルパー関数
const useCountUp = (target: number, frame: number, startFrame: number, duration: number) => {
  const progress = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // イージング関数（加速してから減速）
  const eased = progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

  return Math.floor(target * eased);
};

export const YearWrapped: React.FC<{ stats?: YearStats }> = ({ stats: propsStats }) => {
  const [stats, setStats] = useState<YearStats>(propsStats || defaultStats);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // LocalStorageからデータを読み込む
  useEffect(() => {
    if (!propsStats) {
      const savedData = localStorage.getItem('yearStats');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setStats(parsedData);
        console.log('✅ LocalStorageからデータを読み込みました:', parsedData);
      } else {
        console.log('⚠️ LocalStorageにデータがありません。CalendarTestでデータを取得してください。');
      }
    }
  }, [propsStats]);

  // シーン1: タイトル (0-90フレーム = 0-3秒)
  const titleOpacity = interpolate(frame, [0, 20, 70, 90], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titleScale = spring({
    frame,
    fps,
    config: {
      damping: 20,
      mass: 0.5,
    },
  });

  const titleSlideY = interpolate(frame, [0, 30], [-100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // シーン2: 総イベント数 (90-180フレーム = 3-6秒)
  const totalEventsOpacity = interpolate(frame, [90, 120, 150, 180], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const numberScale = spring({
    frame: frame - 90,
    fps,
    config: {
      damping: 100,
    },
  });

  // シーン3: 最も忙しかった月 (180-270フレーム = 6-9秒)
  const busiestMonthOpacity = interpolate(frame, [180, 210, 240, 270], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // シーン4: よく行った場所 (270-360フレーム = 9-12秒)
  const locationsOpacity = interpolate(frame, [270, 300, 330, 360], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // シーン5: よく会った人 (360-450フレーム = 12-15秒)
  const attendeesOpacity = interpolate(frame, [360, 390, 420, 450], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // シーン6: 写真スライドショー (450-600フレーム = 15-20秒)
  const photosOpacity = interpolate(frame, [450, 480, 570, 600], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // シーン7: エンディング (600-660フレーム = 20-22秒)
  const endingOpacity = interpolate(frame, [600, 630, 660], [0, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const endingScale = spring({
    frame: frame - 600,
    fps,
    config: {
      damping: 30,
    },
  });

  // カウントアップアニメーション
  const countUpValue = useCountUp(stats.totalEvents, frame, 90, 50);

  // パルス効果
  const pulse = Math.sin(frame * 0.2) * 0.05 + 1;

  return (
    <AbsoluteFill>
      {/* アニメーション背景 */}
      <AnimatedBackground frame={frame} />

      {/* パーティクルシステム */}
      {frame < 90 && <ParticleSystem frame={frame} count={30} />}

      {/* シーン1: タイトル */}
      {frame < 90 && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: titleOpacity,
          }}
        >
          <div
            style={{
              textAlign: 'center',
              transform: `translateY(${titleSlideY}px) scale(${titleScale})`,
            }}
          >
            <h1
              style={{
                fontSize: '140px',
                fontWeight: '900',
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '-2px',
                transform: `scale(${pulse})`,
              }}
            >
              Your 2025
            </h1>
            <p
              style={{
                fontSize: '72px',
                fontWeight: '600',
                color: colors.text.primary,
                marginTop: '30px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                textShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
              }}
            >
              Wrapped ✨
            </p>
          </div>
        </AbsoluteFill>
      )}

      {/* シーン2: 総イベント数 */}
      {frame >= 90 && frame < 180 && (
        <>
          <ParticleSystem frame={frame - 90} count={40} />
          <AbsoluteFill
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              opacity: totalEventsOpacity,
            }}
          >
            <div
              style={{
                textAlign: 'center',
                padding: '60px',
                borderRadius: '30px',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: `2px solid rgba(99, 102, 241, 0.2)`,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                transform: `scale(${pulse})`,
              }}
            >
              <p
                style={{
                  fontSize: '48px',
                  color: colors.text.secondary,
                  marginBottom: '30px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: '500',
                }}
              >
                あなたは2025年に
              </p>
              <h2
                style={{
                  fontSize: '200px',
                  fontWeight: '900',
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: 0,
                  transform: `scale(${numberScale}) rotate(${interpolate(frame, [90, 140], [0, 360], { extrapolateRight: 'clamp' })}deg)`,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  textShadow: '0 0 80px rgba(99, 102, 241, 0.5)',
                }}
              >
                {countUpValue}
              </h2>
              <p
                style={{
                  fontSize: '48px',
                  color: colors.text.secondary,
                  marginTop: '30px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: '500',
                }}
              >
                個のイベントがありました 🎉
              </p>
            </div>
          </AbsoluteFill>
        </>
      )}

      {/* シーン3: 最も忙しかった月 */}
      {frame >= 180 && frame < 270 && stats.busiestMonth.month && (
        <>
          <ParticleSystem frame={frame - 180} count={35} />
          <AbsoluteFill
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              opacity: busiestMonthOpacity,
            }}
          >
            <div
              style={{
                textAlign: 'center',
                padding: '80px',
                borderRadius: '30px',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: `2px solid rgba(236, 72, 153, 0.3)`,
                boxShadow: '0 20px 60px rgba(236, 72, 153, 0.2)',
                transform: `scale(${pulse}) rotate(${interpolate(frame, [180, 190, 200], [0, 5, -5], { extrapolateRight: 'clamp' })}deg)`,
              }}
            >
              <p
                style={{
                  fontSize: '52px',
                  color: colors.text.secondary,
                  marginBottom: '40px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: '500',
                }}
              >
                最も忙しかった月は
              </p>
              <h2
                style={{
                  fontSize: '160px',
                  fontWeight: '900',
                  background: `linear-gradient(135deg, ${colors.warning} 0%, ${colors.accent} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: 0,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  textShadow: '0 0 60px rgba(236, 72, 153, 0.4)',
                  transform: `scale(${interpolate(frame, [180, 220], [0.5, 1.2], { extrapolateRight: 'clamp' })})`,
                }}
              >
                {stats.busiestMonth.month}
              </h2>
              <p
                style={{
                  fontSize: '64px',
                  color: colors.text.primary,
                  marginTop: '40px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: '600',
                }}
              >
                {stats.busiestMonth.count}件のイベント 🔥
              </p>
            </div>
          </AbsoluteFill>
        </>
      )}

      {/* シーン4: よく行った場所 TOP3 */}
      {frame >= 270 && frame < 360 && stats.topLocations.length > 0 && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: locationsOpacity,
            padding: '80px',
          }}
        >
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '1400px' }}>
            <h2
              style={{
                fontSize: '72px',
                fontWeight: '700',
                color: colors.text.primary,
                marginBottom: '80px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              よく行った場所 TOP3 📍
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {stats.topLocations.slice(0, 3).map(([location, count], index) => {
                const itemOpacity = interpolate(
                  frame,
                  [270 + index * 10, 270 + index * 10 + 20],
                  [0, 1],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                );
                const itemSlideX = interpolate(
                  frame,
                  [270 + index * 10, 270 + index * 10 + 20],
                  [-100, 0],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                );

                return (
                  <div
                    key={location}
                    style={{
                      padding: '40px 60px',
                      borderRadius: '20px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: `2px solid rgba(${index === 0 ? '99, 102, 241' : index === 1 ? '168, 85, 247' : '16, 185, 129'}, 0.3)`,
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                      opacity: itemOpacity,
                      transform: `translateX(${itemSlideX}px)`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                      <span
                        style={{
                          fontSize: '72px',
                          fontWeight: '900',
                          background: `linear-gradient(135deg, ${index === 0 ? colors.primary : index === 1 ? colors.secondary : colors.success} 0%, ${colors.accent} 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                        }}
                      >
                        {index + 1}
                      </span>
                      <span
                        style={{
                          fontSize: '48px',
                          color: colors.text.primary,
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          fontWeight: '600',
                        }}
                      >
                        {location}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '40px',
                        color: colors.text.secondary,
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontWeight: '500',
                      }}
                    >
                      {count}回
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* シーン5: よく会った人 TOP3 */}
      {frame >= 360 && frame < 450 && stats.topAttendees.length > 0 && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: attendeesOpacity,
            padding: '80px',
          }}
        >
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '1400px' }}>
            <h2
              style={{
                fontSize: '72px',
                fontWeight: '700',
                color: colors.text.primary,
                marginBottom: '80px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              よく会った人 TOP3 👥
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {stats.topAttendees.slice(0, 3).map(([person, count], index) => {
                const itemOpacity = interpolate(
                  frame,
                  [360 + index * 10, 360 + index * 10 + 20],
                  [0, 1],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                );
                const itemSlideX = interpolate(
                  frame,
                  [360 + index * 10, 360 + index * 10 + 20],
                  [100, 0],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                );

                return (
                  <div
                    key={person}
                    style={{
                      padding: '40px 60px',
                      borderRadius: '20px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: `2px solid rgba(${index === 0 ? '168, 85, 247' : index === 1 ? '99, 102, 241' : '236, 72, 153'}, 0.3)`,
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                      opacity: itemOpacity,
                      transform: `translateX(${itemSlideX}px)`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                      <span
                        style={{
                          fontSize: '72px',
                          fontWeight: '900',
                          background: `linear-gradient(135deg, ${index === 0 ? colors.secondary : index === 1 ? colors.primary : colors.accent} 0%, ${colors.accent} 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                        }}
                      >
                        {index + 1}
                      </span>
                      <span
                        style={{
                          fontSize: '48px',
                          color: colors.text.primary,
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          fontWeight: '600',
                        }}
                      >
                        {person}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '40px',
                        color: colors.text.secondary,
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontWeight: '500',
                      }}
                    >
                      {count}回
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* シーン6: 写真スライドショー */}
      {frame >= 450 && frame < 600 && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: photosOpacity,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h2
              style={{
                fontSize: '80px',
                fontWeight: '700',
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '60px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              2025年の思い出 📸
            </h2>
            <div
              style={{
                padding: '80px',
                borderRadius: '30px',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                border: `2px solid rgba(99, 102, 241, 0.3)`,
                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.3)',
              }}
            >
              <p
                style={{
                  fontSize: '48px',
                  color: colors.text.secondary,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  lineHeight: '1.6',
                }}
              >
                Google Driveから選択した<br />
                写真がここに表示されます
              </p>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* シーン7: エンディング */}
      {frame >= 600 && (
        <>
          <ParticleSystem frame={frame - 600} count={60} />
          <AbsoluteFill
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              opacity: endingOpacity,
            }}
          >
            <div
              style={{
                textAlign: 'center',
                transform: `scale(${endingScale}) rotate(${interpolate(frame, [600, 630], [0, 360], { extrapolateRight: 'clamp' })}deg)`,
              }}
            >
              <h1
                style={{
                  fontSize: '120px',
                  fontWeight: '900',
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: 0,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: '-2px',
                  transform: `scale(${pulse})`,
                }}
              >
                Thank You!
              </h1>
              <p
                style={{
                  fontSize: '56px',
                  fontWeight: '500',
                  color: colors.text.secondary,
                  marginTop: '40px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                素敵な2025年でした ✨
              </p>
            </div>
          </AbsoluteFill>
        </>
      )}
    </AbsoluteFill>
  );
};