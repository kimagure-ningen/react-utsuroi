import { useState } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

interface PickerPhoto {
  id: string;
  url: string;
  filename: string;
}

export const PhotosPicker: React.FC<{ onPhotosSelected: (photos: PickerPhoto[]) => void }> = ({ onPhotosSelected }) => {
  const [accessToken, setAccessToken] = useState('');
  
  const CLIENT_ID = '188207356268-ko7e14s0op4hb4hsbo93fm2rhevthesr.apps.googleusercontent.com';

  // OAuth認証
  const handleAuth = () => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
      callback: (response: any) => {
        if (response.access_token) {
          setAccessToken(response.access_token);
          console.log('✅ 認証成功');
        }
      },
    });
    
    client.requestAccessToken();
  };

  // Photo Pickerを開く
  const openPicker = async () => {
    if (!accessToken) {
      alert('先に認証してください');
      return;
    }

    try {
      const response = await window.google.picker.PickerBuilder()
        .addView(window.google.picker.ViewId.PHOTOS)
        .setOAuthToken(accessToken)
        .setDeveloperKey('YOUR_API_KEY') // Google Cloud ConsoleでAPI Keyを作成する必要があります
        .setCallback((data: any) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const photos = data.docs.map((doc: any) => ({
              id: doc.id,
              url: doc.url,
              filename: doc.name,
            }));
            
            onPhotosSelected(photos);
            console.log('✅ 選択された写真:', photos);
          }
        })
        .build();
      
      response.setVisible(true);
    } catch (error) {
      console.error('Pickerエラー:', error);
    }
  };

  return (
    <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>📸 写真を選択</h3>
      <p>Google Photosから写真を選んで動画に追加できます</p>
      
      {!accessToken ? (
        <button
          onClick={handleAuth}
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
          🔐 写真選択の認証
        </button>
      ) : (
        <button
          onClick={openPicker}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#34a853',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          📷 写真を選択
        </button>
      )}
    </div>
  );
};