import React, { useState, useEffect } from 'react';
import { PlayCircle } from 'lucide-react';

const LoadingScreen = () => {
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    // Verificar se vídeo já está pré-carregado no index.html
    if (window.preloadedVideo) {
      const video = window.preloadedVideo;
      
      if (video.readyState >= 2) { // HAVE_CURRENT_DATA
        // Vídeo já está pronto, esperar tempo mínimo antes de mostrar
        const timer = setTimeout(() => {
          setVideoReady(true);
          video.play().catch(() => {}); // Ignorar erro de autoplay
        }, 1);
        
        return () => clearTimeout(timer);
      } else {
        // Esperar vídeo ficar pronto + tempo mínimo delay
        video.onloadeddata = () => {
          const timer = setTimeout(() => {
            setVideoReady(true);
            video.play().catch(() => {});
          }, 1);
          
          return () => clearTimeout(timer);
        };
      }
      return;
    }
    
    // Fallback: criar vídeo se não foi pré-carregado
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    
    video.onloadeddata = () => {
      // Esperar tempo mínimo antes de mostrar
      const timer = setTimeout(() => {
        setVideoReady(true);
        video.play().catch(() => {});
      }, 1);
      
      return () => clearTimeout(timer);
    };
    
    video.src = '/videos/Koala.mp4';
    video.load();
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex items-start justify-center pt-20 z-50" style={{ paddingLeft: '250px' }}>
      <div className="relative">
        {/* Video pré-carregado no index.html - aparece instantaneamente */}
        {videoReady && (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-80 h-80 object-cover rounded-lg"
            src="/videos/Koala.mp4"
          >
            <source src="/videos/Koala.mp4" type="video/mp4" />
            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
          </video>
        )}
        
        {/* Fallback enquanto vídeo não está pronto */}
        {!videoReady && (
          <div className="w-80 h-80 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
            <div className="text-center">
              <PlayCircle className="w-20 h-20 text-blue-600 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-800 text-sm font-medium">Preparando vídeo...</p>
            </div>
          </div>
        )}
        
        {/* Loading Text Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 to-transparent p-1 rounded-b-lg">
          <div className="text-gray-800 text-center">
            <p className="text-sm font-medium text-gray-800">Carregando...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
