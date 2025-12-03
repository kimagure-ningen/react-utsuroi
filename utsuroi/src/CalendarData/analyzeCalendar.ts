import { CalendarEvent, YearStats } from '../types';

export const analyzeCalendar = (events: CalendarEvent[]): YearStats => {
  // 月別イベント数
  const eventsByMonth: { [key: string]: number } = {};
  events.forEach((event) => {
    const date = new Date(event.start.dateTime || event.start.date || '');
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    eventsByMonth[month] = (eventsByMonth[month] || 0) + 1;
  });

  // 最も忙しかった月
  const busiestMonthEntry = Object.entries(eventsByMonth).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const busiestMonth = busiestMonthEntry
    ? { month: busiestMonthEntry[0], count: busiestMonthEntry[1] }
    : { month: '', count: 0 };

  // 頻出する場所
  const locations: { [key: string]: number } = {};
  events.forEach((event) => {
    if (event.location) {
      locations[event.location] = (locations[event.location] || 0) + 1;
    }
  });
  const topLocations = Object.entries(locations)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 参加者の集計
  const attendees: { [key: string]: number } = {};
  events.forEach((event) => {
    event.attendees?.forEach((attendee) => {
      const name = attendee.displayName || attendee.email;
      attendees[name] = (attendees[name] || 0) + 1;
    });
  });
  const topAttendees = Object.entries(attendees)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    totalEvents: events.length,
    busiestMonth,
    topLocations,
    topAttendees,
    eventsByMonth,
  };
};