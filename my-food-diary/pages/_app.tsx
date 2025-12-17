// pages/_app.tsx

import '../styles/globals.css';
import type { AppProps } from 'next/app';
// NextPage를 임포트하고 Layout을 위한 타입을 확장합니다.
import type { NextPage } from 'next';
import Head from 'next/head';
import Layout from '../components/Layout/Layout';

// 1. Layout을 가진 페이지 타입을 정의합니다.
// getLayout 속성을 가진 페이지 컴포넌트를 정의합니다.
type NextPageWithLayout = NextPage & {
  getLayout?: (page: React.ReactElement) => React.ReactNode;
};

// 2. AppProps를 확장하여 Layout을 가진 페이지 타입을 포함합니다.
type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

// 3. MyApp 함수에서 확장된 AppProps를 사용합니다.
function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  // `getLayout` 함수가 있으면 이를 사용하고, 없으면 기본 Layout을 적용합니다.
  const getLayout = Component.getLayout ?? ((page) => <Layout>{page}</Layout>);

  return (
    <>
      <Head>
        <title>맛집 지도 기록 서비스</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      {/* getLayout 함수를 호출하여 페이지에 Layout을 적용합니다. */}
      {getLayout(<Component {...pageProps} />)}
    </>
  );
}

export default MyApp;