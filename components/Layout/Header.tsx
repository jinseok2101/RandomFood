// components/Layout/Header.tsx

import React from 'react';
import Link from 'next/link';
// Link 컴포넌트 내부의 <a> 태그를 제거합니다.

const Header: React.FC = () => {
  return (
    <header style={{ 
      background: '#4285F4', 
      color: 'white', 
      padding: '15px 20px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center' 
    }}>
      {/* 1. Link 수정: <a> 태그와 passHref를 제거하고, 스타일은 <h2>에 적용 */}
      <Link href="/">
        <h2 style={{ margin: 0, cursor: 'pointer', color: 'white' }}>📌 맛집 기록 지도</h2>
      </Link>
      <nav>
        {/* 2. Link 수정: <a> 태그와 passHref를 제거하고, 스타일은 <Link>에 적용 */}
        <Link href="/my-page" style={{ color: 'white', marginLeft: '20px' }}>
          내 기록
        </Link>
      </nav>
    </header>
  );
};

export default Header;