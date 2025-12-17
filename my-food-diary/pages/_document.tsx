// pages/_document.tsx

import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    // 환경 변수에서 키를 가져옵니다.
    const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAOMAP_APP_KEY;

    return (
      <Html lang="ko">
        <Head>
          {/* 카카오 지도 API 스크립트 로드 */}
          <script
            type="text/javascript"
            src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services,clusterer`}
            // 'services' 라이브러리는 장소 검색을 위해, 'clusterer'는 마커 군집화를 위해 추가했습니다.
          ></script>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;