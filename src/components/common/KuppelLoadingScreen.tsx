import React from 'react';
import { Logo } from '@/components/ui/logo';

export const KuppelLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Kuppel Gradient Background */}
      <div 
        className="absolute inset-0 opacity-90"
        style={{
          background: 'var(--gradient-kuppel)'
        }}
      />
      
      {/* Animated Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 animate-pulse" />
      
      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Logo Container */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto bg-white rounded-full flex items-center justify-center shadow-2xl animate-scale-in">
            <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              U
            </div>
          </div>
          
          {/* Rotating Ring */}
          <div className="absolute inset-0 w-32 h-32 mx-auto border-4 border-white/30 rounded-full animate-spin">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
          </div>
        </div>
        
        {/* Loading Text */}
        <div className="text-white space-y-2">
          <h2 className="text-2xl font-semibold">Cargando Configuraciones</h2>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-8 w-64 mx-auto">
          <div className="w-full bg-white/20 rounded-full h-1">
            <div className="bg-white h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-white/20 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-white/40 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
    </div>
  );
};

export default KuppelLoadingScreen;