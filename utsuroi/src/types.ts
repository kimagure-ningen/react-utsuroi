export interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
}

export interface YearStats {
  totalEvents: number;
  busiestMonth: { month: string; count: number };
  topLocations: Array<[string, number]>;
  topAttendees: Array<[string, number]>;
  eventsByMonth: { [key: string]: number };
}

export interface GooglePhoto {
  id: string;
  baseUrl: string;
  mimeType: string;
  filename: string;
  mediaMetadata?: {
    creationTime: string;
    width: string;
    height: string;
  };
}