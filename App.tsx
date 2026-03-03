import React, { useState, useEffect, useCallback } from 'react';
import { SettingsProvider, defaultSettings } from './contexts/SettingsContext';
import { AudioProvider } from './contexts/AudioContext';
import LoadingScreen from './components/LoadingScreen';
import MainMenu from './components/MainMenu';
import SettingsMenu from './components/SettingsMenu';
import GameScreen from './components/game/GameScreen';
import DifficultySelectionScreen from './components/DifficultySelectionScreen';
import DuelSelectionScreen from './components/DuelSelectionScreen';
import SandboxSelectionScreen from './components/SandboxSelectionScreen';
import HangarScreen from './components/HangarScreen';
import CustomCursor from './components/game/CustomCursor';

import type { Screen, GameConfig } from './types';

const TRANSITION_DURATION = 400; // ms, should match CSS

const App: React.FC = () => {
  // New screen state management for smoother transitions
  const [currentScreen, setCurrentScreen] = useState<Screen>('loading');
  const [prevScreenForAnimation, setPrevScreenForAnimation] = useState<Screen | null>(null);
  const [screenToReturnTo, setScreenToReturnTo] = useState<Screen>('main-menu');
  
  // Game Configuration State
  const [gameConfig, setGameConfig] = useState<GameConfig>({ mode: 'campaign' });
  const [gameKey, setGameKey] = useState(0);

  const navigateTo = useCallback((screen: Screen) => {
    // Special case for restarting the game
    if (screen === 'game' && currentScreen === 'game') {
      setGameKey(prev => prev + 1);
      return;
    }

    if (screen === currentScreen) return;
    
    // Store the screen we came from if we're going to the settings page
    if (screen === 'settings') {
      setScreenToReturnTo(currentScreen);
    }

    setPrevScreenForAnimation(currentScreen);
    setCurrentScreen(screen);

    // After the animation duration, remove the old screen from the DOM
    setTimeout(() => {
      setPrevScreenForAnimation(null);
    }, TRANSITION_DURATION);
  }, [currentScreen]);

  const goBack = useCallback(() => {
    navigateTo(screenToReturnTo);
  }, [screenToReturnTo, navigateTo]);

  const handleLoadingComplete = useCallback(() => {
    navigateTo('main-menu');
  }, [navigateTo]);

  const renderScreen = (screen: Screen) => {
    switch (screen) {
      case 'loading':
        return <LoadingScreen onComplete={handleLoadingComplete} />;
      case 'main-menu':
        return <MainMenu navigateTo={navigateTo} />;
      case 'settings':
        return <SettingsMenu goBack={goBack} navigateTo={navigateTo} />;
      case 'difficulty-selection':
        return (
          <DifficultySelectionScreen 
            navigateTo={navigateTo} 
            setGameConfig={setGameConfig}
          />
        );
      case 'duel-selection':
        return (
          <DuelSelectionScreen 
            navigateTo={navigateTo} 
            setGameConfig={setGameConfig} 
          />
        );
      case 'sandbox-selection':
        return (
          <SandboxSelectionScreen 
            navigateTo={navigateTo} 
            setGameConfig={setGameConfig} 
          />
        );
      case 'hangar':
        return <HangarScreen navigateTo={navigateTo} />;
      case 'game':
        return <GameScreen key={`game-${gameKey}`} navigateTo={navigateTo} config={gameConfig} />;
      default:
        return <MainMenu navigateTo={navigateTo} />;
    }
  };

  return (
    <SettingsProvider>
      <AudioProvider>
        <div className="relative min-h-screen bg-stone-950 text-stone-100 overflow-hidden">
          {/* Custom Universal Cursor */}
          <CustomCursor currentScreen={currentScreen} />

          {/* Background futuristic grid */}
          <div className="absolute inset-0 z-0 bg-transparent bg-[linear-gradient(to_right,rgba(0,224,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,224,255,0.04)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
          <div className="absolute inset-0 z-1 bg-gradient-to-b from-transparent via-black/50 to-black/90"></div>
          
          {/* Scanlines effect */}
          <div className="absolute inset-0 z-2 scanlines pointer-events-none"></div>

          <div className="relative z-10 screen-transition-wrapper">
            {prevScreenForAnimation && (
              <div key={prevScreenForAnimation} className="screen-container out">
                {renderScreen(prevScreenForAnimation)}
              </div>
            )}
            <div key={currentScreen} className="screen-container in">
              {renderScreen(currentScreen)}
            </div>
          </div>
        </div>
      </AudioProvider>
    </SettingsProvider>
  );
};

export default App;