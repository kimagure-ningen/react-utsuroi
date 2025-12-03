import { GooglePhoto } from '../types';

export const fetchPhotosForYear = async (
  accessToken: string,
  year: number = 2025
): Promise<GooglePhoto[]> => {
  const photos: GooglePhoto[] = [];
  let nextPageToken: string | undefined;

  console.log(`📸 ${year}年の写真を取得開始...`);

  try {
    // 年の開始日と終了日
    const startDate = new Date(`${year}-01-01T00:00:00Z`);
    const endDate = new Date(`${year}-12-31T23:59:59Z`);

    console.log('🔍 検索期間:', {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });

    do {
      const requestBody = {
        pageSize: 100,
        pageToken: nextPageToken,
        filters: {
          dateFilter: {
            ranges: [
              {
                startDate: {
                  year: startDate.getFullYear(),
                  month: startDate.getMonth() + 1,
                  day: startDate.getDate(),
                },
                endDate: {
                  year: endDate.getFullYear(),
                  month: endDate.getMonth() + 1,
                  day: endDate.getDate(),
                },
              },
            ],
          },
        },
      };

      console.log('🔍 リクエストBody:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(
        'https://photoslibrary.googleapis.com/v1/mediaItems:search',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Photos API Error:', errorData);
        throw new Error(`Photos API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 APIレスポンス:', data);
      
      const items = data.mediaItems || [];
      console.log(`📷 このページで取得した写真数: ${items.length}`);
      
      photos.push(...items);

      nextPageToken = data.nextPageToken;
      console.log(`🔄 nextPageToken: ${nextPageToken ? 'あり' : 'なし'}`);

      console.log(`✅ 現在の合計: ${photos.length}枚`);
    } while (nextPageToken);

    console.log(`✅ 最終的に取得した写真: ${photos.length}枚`);
    return photos;
  } catch (error) {
    console.error('❌ 写真取得エラー:', error);
    throw error;
  }
};

// イベント日時に近い写真を取得
export const getPhotosForEvent = (
  photos: GooglePhoto[],
  eventDate: Date,
  range: number = 1 // 前後何日まで許容するか
): GooglePhoto[] => {
  return photos.filter((photo) => {
    if (!photo.mediaMetadata?.creationTime) return false;

    const photoDate = new Date(photo.mediaMetadata.creationTime);
    const diffDays = Math.abs(
      (photoDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return diffDays <= range;
  });
};