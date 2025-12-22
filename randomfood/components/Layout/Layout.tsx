// components/Layout/Layout.tsx

import React, { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div>
      <Header />
      <main style={{ padding: '20px' }}>
        {children}
      </main>
      {/* Footer는 생략하거나 추후 추가할 수 있습니다. */}
    </div>
  );
};

export default Layout;