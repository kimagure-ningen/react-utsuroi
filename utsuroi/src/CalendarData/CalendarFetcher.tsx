import { useEffect, useState } from 'react';
import { PhotosPicker } from './PhotosPicker';
import { GooglePhoto } from '../types';

interface CalendarEvent {
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

export const CalendarFetcher: React.FC = () => {
  const [accessToken, setAccessToken] = useState('');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<GooglePhoto[]>([]);

  const CLIENT_ID = '188207356268-ko7e14s0op4hb4hsbo93fm2rhevthesr.apps.googleusercontent.com';
  const REDIRECT_URI = window.location.origin + window.location.pathname;
  const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/photoslibrary.readonly https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata';

  // OAuth認証URLを生成（リダイレクト方式）
  const handleLogin = () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'token',
      scope: SCOPES,
      prompt: 'consent',
    })}`;

    // デバッグ: URLをコンソールに表示
    console.log('🔍 認証URL:', authUrl);
    console.log('🔍 SCOPES:', SCOPES);
    
    // 同じウィンドウでリダイレクト
    window.location.href = authUrl;
  };

  // URLからトークンを取得
  useEffect(() => {
    const hash = window.location.hash;
    console.log('Current hash:', hash); // デバッグ用
    
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      console.log('Token found:', token ? 'Yes' : 'No'); // デバッグ用
      
      if (token) {
        setAccessToken(token);
        localStorage.setItem('accessToken', token);
        console.log('✅ アクセストークン取得成功');
        // URLからハッシュを削除
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // トークンが設定されたら自動でデータ取得
  useEffect(() => {
    if (accessToken && events.length === 0 && !loading) {
      console.log('🚀 自動でイベント取得開始');
      fetchCalendarEvents();
    }
  }, [accessToken]);

  // 2025年のカレンダーイベントを取得
  const fetchCalendarEvents = async () => {
    if (!accessToken) {
      alert('先にログインしてください');
      return;
    }

    setLoading(true);
    console.log('📡 カレンダーAPIにリクエスト中...');
    
    // デバッグ: トークン情報を確認
    try {
      const tokenInfo = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
      const tokenData = await tokenInfo.json();
      console.log('🔍 トークン情報:', tokenData);
      console.log('🔍 含まれているスコープ:', tokenData.scope);

      // Photos Library APIのスコープがあるか確認
      const hasPhotosScope = tokenData.scope?.includes('photoslibrary');
      console.log(
        hasPhotosScope
          ? '✅ Photos Library APIのスコープが含まれています'
          : '❌ Photos Library APIのスコープがありません'
      );

      if (!hasPhotosScope) {
        console.warn(
          '⚠️ 警告: Photos Library APIのスコープがないため、写真の自動取得は失敗する可能性があります'
        );
        console.warn('💡 解決方法: もう一度ログアウト→ログインして、すべての権限を許可してください');
      }
    } catch (e) {
      console.error('トークン情報取得エラー:', e);
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${new URLSearchParams({
          timeMin: '2025-01-01T00:00:00Z',
          timeMax: '2025-12-31T23:59:59Z',
          maxResults: '2500',
          singleEvents: 'true',
          orderBy: 'startTime',
        })}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const fetchedEvents = data.items || [];
      setEvents(fetchedEvents);

      // コンソールに詳細を表示
      console.log('=== 2025年のカレンダーイベント ===');
      console.log(`総イベント数: ${fetchedEvents.length}`);
      console.log('イベント一覧:', fetchedEvents);

      if (fetchedEvents.length > 0) {
        // 統計情報を計算
        analyzeEvents(fetchedEvents);
      } else {
        console.log('⚠️ 2025年のイベントが見つかりませんでした');
      }

      // 写真も取得
      console.log('\n📸 写真の取得を開始...');
      try {
        const { fetchPhotosForYear } = await import('./fetchPhotos');
        const photos = await fetchPhotosForYear(accessToken, 2025);

        // LocalStorageに写真データも保存
        localStorage.setItem('yearPhotos', JSON.stringify(photos));
        console.log('💾 写真データをLocalStorageに保存しました');
      } catch (photoError: any) {
        console.error('❌ 写真取得エラー:', photoError);

        // 403エラーの場合は詳細な説明を表示
        if (photoError.message && photoError.message.includes('403')) {
          alert(
            '写真の取得に失敗しました (403エラー)\n\n' +
            '原因:\n' +
            '1. Google Cloud ConsoleでPhotos Library APIが有効化されていない\n' +
            '2. OAuth同意画面に必要なスコープが登録されていない\n\n' +
            '解決方法:\n' +
            '- 手動で写真を選択する機能を使用してください\n' +
            '- または、Google Cloud Consoleの設定を確認してください'
          );
        } else {
          alert(`写真取得エラー: ${photoError.message || '不明なエラー'}`);
        }

        // 写真取得は失敗してもカレンダーデータは保存されているので続行
        console.log('⚠️ 写真の自動取得は失敗しましたが、カレンダーデータは取得できています');
        console.log('💡 「写真を手動で選択」機能を使用してください');
      }
    } catch (error) {
      console.error('❌ イベント取得エラー:', error);
      alert('エラーが発生しました。もう一度ログインしてください。');
      setAccessToken('');
    } finally {
      setLoading(false);
    }
  };

  // イベントデータの分析
  const analyzeEvents = (events: CalendarEvent[]) => {
    console.log('\n📊 === 統計分析開始 ===\n');

    // 月別イベント数
    const eventsByMonth: { [key: string]: number } = {};
    events.forEach((event) => {
      const date = new Date(event.start.dateTime || event.start.date || '');
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      eventsByMonth[month] = (eventsByMonth[month] || 0) + 1;
    });

    console.log('📅 月別イベント数:', eventsByMonth);

    // 最も忙しかった月
    const busiestMonth = Object.entries(eventsByMonth).sort(
      (a, b) => b[1] - a[1]
    )[0];
    if (busiestMonth) {
      console.log(
        `🔥 最も忙しかった月: ${busiestMonth[0]} (${busiestMonth[1]}件)`
      );
    }

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
    console.log('📍 よく行った場所 TOP5:', topLocations);

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
    console.log('👥 よく会った人 TOP5:', topAttendees);

    // 結果をLocalStorageに保存
    const statsData = {
      totalEvents: events.length,
      busiestMonth,
      topLocations,
      topAttendees,
      eventsByMonth,
    };
    
    localStorage.setItem('yearStats', JSON.stringify(statsData));
    console.log('💾 統計データをLocalStorageに保存しました');

    console.log('\n✅ === 統計分析完了 ===\n');
  };

  const handlePhotosSelected = (photos: GooglePhoto[]) => {
    setSelectedPhotos(photos);
    console.log('✅ 写真が選択されました:', photos.length, '枚');
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>
        🎬 Utsuroi - Calendar Data Fetcher
      </h1>

      {!accessToken ? (
        <div>
          <p style={{ fontSize: '18px', marginBottom: '20px' }}>
            Googleアカウントでログインして、2025年のカレンダーデータを取得します
          </p>
          <button
            onClick={handleLogin}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              cursor: 'pointer',
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            🔐 Googleでログイン
          </button>
          <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
            ※ Googleの認証画面にリダイレクトします
          </p>
        </div>
      ) : (
        <div>
          <p style={{ color: 'green', fontSize: '18px', marginBottom: '20px' }}>
            ✅ ログイン済み {loading && '⏳ データ取得中...'}
          </p>
          
          {!loading && (
            <>
              <button
                onClick={fetchCalendarEvents}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  backgroundColor: '#34a853',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  marginRight: '10px',
                }}
              >
                📊 2025年のイベントを取得
              </button>
              <button
                onClick={() => {
                  setAccessToken('');
                  setEvents([]);
                }}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  backgroundColor: '#ea4335',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                }}
              >
                🚪 ログアウト
              </button>
            </>
          )}

          {events.length > 0 && (
            <div
              style={{
                marginTop: '30px',
                padding: '20px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
              }}
            >
              <h2 style={{ fontSize: '24px' }}>✨ 取得完了！</h2>
              <p style={{ fontSize: '18px', marginTop: '10px' }}>
                総イベント数: <strong>{events.length}件</strong>
              </p>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                📊 詳細はブラウザのコンソール（DevTools）を開いて確認してください
              </p>
            </div>
          )}

          {events.length > 0 && (
            <PhotosPicker onPhotosSelected={handlePhotosSelected} />
          )}
          
          {selectedPhotos.length > 0 && (
            <div
              style={{
                marginTop: '20px',
                padding: '20px',
                backgroundColor: '#e8f5e9',
                borderRadius: '8px',
              }}
            >
              <h3 style={{ fontSize: '20px' }}>✅ 写真選択完了</h3>
              <p style={{ fontSize: '16px' }}>
                選択した写真: <strong>{selectedPhotos.length}枚</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};