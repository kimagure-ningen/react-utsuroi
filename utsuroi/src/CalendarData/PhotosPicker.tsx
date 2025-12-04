import { useState } from 'react';
import { GooglePhoto } from '../types';

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

export const PhotosPicker: React.FC<{ 
  onPhotosSelected: (photos: GooglePhoto[]) => void 
}> = ({ onPhotosSelected }) => {
  const [loading, setLoading] = useState(false);
  
  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

  const initializePicker = () => {
    setLoading(true);
    
    // カレンダー認証で取得したトークンを使う
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      alert('先にカレンダーデータを取得してください');
      setLoading(false);
      return;
    }

    loadPickerWithToken(accessToken);
  };

  const loadPickerWithToken = (accessToken: string) => {
    if (!window.gapi) {
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.onload = () => {
        console.log('✅ gapi読み込み完了');
        window.gapi.load('picker', () => {
          console.log('✅ picker読み込み完了');
          createPicker(accessToken);
        });
      };
      document.body.appendChild(gapiScript);
    } else {
      window.gapi.load('picker', () => {
        console.log('✅ picker読み込み完了');
        createPicker(accessToken);
      });
    }
  };

  const createPicker = (accessToken: string) => {
    console.log('🔍 Picker作成開始');
    console.log('🔍 accessToken:', accessToken ? '存在する' : '存在しない');
    console.log('🔍 API_KEY:', API_KEY);
    
    try {
      // ビューを指定せずに最もシンプルに
      const docsView = new window.google.picker.DocsView();
      docsView.setIncludeFolders(true);
      docsView.setMimeTypes('image/png,image/jpeg,image/jpg');
      
      const picker = new window.google.picker.PickerBuilder()
        .addView(docsView)
        .setOAuthToken(accessToken)
        .setDeveloperKey(API_KEY)
        .setCallback((data: any) => {
          console.log('📦 Pickerコールバック:', data);
          if (data.action === window.google.picker.Action.PICKED) {
            console.log('✅ 選択されました:', data.docs);
          }
        })
        .build();
      
      console.log('✅ Picker作成成功');
      picker.setVisible(true);
      setLoading(false);
    } catch (error) {
      console.error('❌ Picker作成エラー:', error);
      setLoading(false);
    }
  };

  const handlePickerCallback = (data: any) => {
    if (data.action === window.google.picker.Action.PICKED) {
      console.log('✅ 選択された写真:', data.docs);
      
      const photos: GooglePhoto[] = data.docs.map((doc: any) => ({
        id: doc.id,
        baseUrl: doc.url,
        mimeType: doc.mimeType || 'image/jpeg',
        filename: doc.name,
        mediaMetadata: {
          creationTime: new Date().toISOString(),
          width: '1920',
          height: '1080',
        },
      }));
      
      onPhotosSelected(photos);
      localStorage.setItem('yearPhotos', JSON.stringify(photos));
      console.log('💾 選択した写真を保存しました:', photos.length, '枚');
    }
  };

  return (
    <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>📸 写真を手動で選択</h3>
      <p>Google Photosから動画に使いたい写真を選んでください</p>
      
      <button
        onClick={initializePicker}
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          backgroundColor: loading ? '#ccc' : '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        {loading ? '⏳ 読み込み中...' : '📷 写真を選択'}
      </button>
    </div>
  );
};