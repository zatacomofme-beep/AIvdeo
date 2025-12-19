import React from 'react';

export function TestComponent() {
  return (
    <div className="p-8 bg-red-500 text-white">
      <h1 className="text-4xl font-bold mb-4">Test Component</h1>
      <p className="text-lg">If you can see this red background and white text, Tailwind is working!</p>
      <div className="mt-4 p-4 bg-blue-500 rounded-lg">
        <p>This should be blue with rounded corners</p>
      </div>
      <div className="mt-4 p-4 bg-yellow-400 text-black rounded-lg">
        <p>This should be yellow with black text</p>
      </div>
    </div>
  );
}