/**
 * ⚠️ 注意：此文件为旧版布局架构，当前不再使用
 * 
 * 当前项目入口使用的是 src/app/App.tsx
 * 此文件保留用于参考或备用布局方案
 * 
 * 如需修改主应用，请编辑 src/app/App.tsx
 */

import React from 'react';
import { ModernLayout } from './components/layout/ModernLayout';
import { MainWorkspace } from './components/layout/MainWorkspace';

export default function App() {
  return (
    <ModernLayout>
      <MainWorkspace />
    </ModernLayout>
  );
}
