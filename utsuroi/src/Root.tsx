import { Composition } from 'remotion';
import { CalendarFetcher } from './CalendarData/CalendarFetcher';
import { YearWrapped } from './Video/YearWrapped';
import { YearStats } from './types';

// LocalStorageからデータを読み込む関数
const getYearStats = (): YearStats => {
  if (typeof window !== 'undefined') {
    const savedData = localStorage.getItem('yearStats');
    if (savedData) {
      return JSON.parse(savedData);
    }
  }
  
  // デフォルトデータ
  return {
    totalEvents: 0,
    busiestMonth: { month: '未取得', count: 0 },
    topLocations: [],
    topAttendees: [],
    eventsByMonth: {},
  };
};

export const RemotionRoot: React.FC = () => {
  const stats = getYearStats();

  return (
    <>
      <Composition
        id="CalendarTest"
        component={CalendarFetcher}
        durationInFrames={1}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="YearWrapped"
        component={YearWrapped}
        durationInFrames={360}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          stats: stats,
        }}
      />
    </>
  );
};