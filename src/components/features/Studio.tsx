import React from 'react';
import { VisualCanvas } from '../layout/VisualCanvas';
import { DirectorConsole } from '../layout/DirectorConsole';

export function Studio() {
  return (
    <div className="flex-1 flex h-full overflow-hidden">
      <VisualCanvas />
      <DirectorConsole />
    </div>
  );
}
