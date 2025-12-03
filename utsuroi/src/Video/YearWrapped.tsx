import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from 'remotion';
import { useEffect, useState } from 'react';
import { YearStats } from '../types';

// デフォルトデータ
const defaultStats: YearStats = {
  totalEvents: 0,
  busiestMonth: { month: '未取得', count: 0 },
  topLocations: [],
  topAttendees: [],
  eventsByMonth: {},
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
  const titleOpacity = interpolate(frame, [0, 30, 60, 90], [0, 1, 1, 0], {
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

  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a2e' }}>
      {/* シーン1: タイトル */}
      {frame < 90 && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: titleOpacity,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h1
              style={{
                fontSize: '120px',
                fontWeight: 'bold',
                color: '#ffffff',
                margin: 0,
                fontFamily: 'Arial, sans-serif',
              }}
            >
              Your 2025
            </h1>
            <p
              style={{
                fontSize: '48px',
                color: '#16f4d0',
                marginTop: '20px',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              Wrapped
            </p>
          </div>
        </AbsoluteFill>
      )}

      {/* シーン2: 総イベント数 */}
      {frame >= 90 && frame < 180 && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: totalEventsOpacity,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontSize: '60px',
                color: '#ffffff',
                marginBottom: '40px',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              あなたは2025年に
            </p>
            <h2
              style={{
                fontSize: '180px',
                fontWeight: 'bold',
                color: '#16f4d0',
                margin: 0,
                transform: `scale(${numberScale})`,
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {stats.totalEvents}
            </h2>
            <p
              style={{
                fontSize: '60px',
                color: '#ffffff',
                marginTop: '40px',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              個のイベントがありました
            </p>
          </div>
        </AbsoluteFill>
      )}

      {/* シーン3: 最も忙しかった月 */}
      {frame >= 180 && frame < 270 && stats.busiestMonth.month && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: busiestMonthOpacity,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontSize: '60px',
                color: '#ffffff',
                marginBottom: '40px',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              最も忙しかった月は
            </p>
            <h2
              style={{
                fontSize: '140px',
                fontWeight: 'bold',
                color: '#ff6b6b',
                margin: 0,
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {stats.busiestMonth.month}
            </h2>
            <p
              style={{
                fontSize: '80px',
                color: '#ffffff',
                marginTop: '40px',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {stats.busiestMonth.count}件のイベント 🔥
            </p>
          </div>
        </AbsoluteFill>
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
          <div style={{ textAlign: 'center', width: '100%' }}>
            <h2
              style={{
                fontSize: '80px',
                color: '#ffffff',
                marginBottom: '60px',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              よく行った場所 TOP3 📍
            </h2>
            {stats.topLocations.slice(0, 3).map(([location, count], index) => (
              <div
                key={location}
                style={{
                  fontSize: '50px',
                  color: '#16f4d0',
                  marginBottom: '30px',
                  fontFamily: 'Arial, sans-serif',
                  opacity: interpolate(
                    frame,
                    [270 + index * 10, 270 + index * 10 + 20],
                    [0, 1],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                  ),
                }}
              >
                {index + 1}. {location} ({count}回)
              </div>
            ))}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};