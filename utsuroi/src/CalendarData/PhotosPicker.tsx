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

  const API_KEY = process.env.REMOTION_GOOGLE_API_KEY;

  const initializePicker = () => {
    setLoading(true);

    // API KEYの確認
    if (!API_KEY) {
      alert('Google API Keyが設定されていません。.envファイルを確認してください。');
      setLoading(false);
      return;
    }

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
      // Google Photosビューを使用
      const photosView = new window.google.picker.PhotosView();
      photosView.setType(window.google.picker.PhotosView.Type.ALL);

      // Google Driveのビューも追加（画像ファイル用）
      const docsView = new window.google.picker.DocsView();
      docsView.setIncludeFolders(true);
      docsView.setMimeTypes('image/png,image/jpeg,image/jpg,image/gif,image/webp');

      const picker = new window.google.picker.PickerBuilder()
        .addView(photosView)
        .addView(docsView)
        .setOAuthToken(accessToken)
        .setDeveloperKey(API_KEY)
        .setCallback(handlePickerCallback)  // handlePickerCallback関数を直接呼び出し
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
    console.log('📦 Pickerコールバック:', data);

    if (data.action === window.google.picker.Action.PICKED) {
      console.log('✅ 選択された写真:', data.docs);

      try {
        const photos: GooglePhoto[] = data.docs.map((doc: any) => {
          console.log('📸 処理中の写真:', doc);

          return {
            id: doc.id,
            baseUrl: doc.url || doc.embedUrl || '',
            mimeType: doc.mimeType || 'image/jpeg',
            filename: doc.name || `photo-${doc.id}`,
            mediaMetadata: {
              creationTime: doc.lastEditedUtc ? new Date(parseInt(doc.lastEditedUtc)).toISOString() : new Date().toISOString(),
              width: doc.sizeBytes ? '1920' : '1920',
              height: doc.sizeBytes ? '1080' : '1080',
            },
          };
        });

        console.log('✅ 変換された写真データ:', photos);
        onPhotosSelected(photos);
        localStorage.setItem('yearPhotos', JSON.stringify(photos));
        console.log('💾 選択した写真を保存しました:', photos.length, '枚');
      } catch (error) {
        console.error('❌ 写真データの処理中にエラー:', error);
        alert('写真の処理中にエラーが発生しました');
      }
    } else if (data.action === window.google.picker.Action.CANCEL) {
      console.log('❌ ユーザーが選択をキャンセルしました');
      setLoading(false);
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