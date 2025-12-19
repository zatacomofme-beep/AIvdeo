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
