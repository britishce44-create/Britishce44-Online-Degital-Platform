import React from 'react';

interface ClassroomScrollWrapperProps {
  children: React.ReactNode;
}

export const ClassroomScrollWrapper: React.FC<ClassroomScrollWrapperProps> = ({ children }) => {
  return (
    <div className="w-screen h-screen overflow-x-hidden overflow-y-auto bg-gray-900 scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-gray-800">
      {/* Custom CSS to force visible, draggable right-hand scrollbar across browsers */}
      <style>{`
        ::-webkit-scrollbar {
          width: 12px !important;
          display: block !important;
        }
        ::-webkit-scrollbar-track {
          background: #111827 !important;
        }
        ::-webkit-scrollbar-thumb {
          background: #b48328 !important;
          border-radius: 6px !important;
          border: 2px solid #111827 !important;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #d49a30 !important;
        }
      `}</style>
      <div className="min-h-full flex flex-col">
        {children}
      </div>
    </div>
  );
};
