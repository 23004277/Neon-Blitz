
import React, { useState, useEffect, useCallback } from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import LoadingScreen from './components/LoadingScreen';
import MainMenu from './components/MainMenu';
import SettingsMenu from './components/SettingsMenu';
import GameScreen from './components/game/GameScreen';
import DifficultySelectionScreen from './components/DifficultySelectionScreen';
import DuelSelectionScreen from './components/DuelSelectionScreen';
import Chatbot from './components/chatbot/Chatbot';
import ChatbotToggleButton from './components/chatbot/ChatbotToggleButton';
import CustomCursor from './components/game/CustomCursor';
import { GoogleGenAI } from '@google/genai';

import type { Screen, ChatMessage, GameConfig } from './types';

const TRANSITION_DURATION = 400; // ms, should match CSS

const App: React.FC = () => {
  // New screen state management for smoother transitions
  const [currentScreen, setCurrentScreen] = useState<Screen>('loading');
  const [prevScreenForAnimation, setPrevScreenForAnimation] = useState<Screen | null>(null);
  const [screenToReturnTo, setScreenToReturnTo] = useState<Screen>('main-menu');
  
  // Game Configuration State
  const [gameConfig, setGameConfig] = useState<GameConfig>({ mode: 'campaign' });

  // Chatbot state lifted to App component
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: "Commander Darlek online. What do you need, Recruit? Make it quick." }
  ]);
  const [isChatbotLoading, setIsChatbotLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigateTo('main-menu');
    }, 3000); // Show loading screen for 3 seconds
    return () => clearTimeout(timer);
  }, []);

  const navigateTo = useCallback((screen: Screen) => {
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

  const handleSendMessage = async (input: string) => {
    if (!input.trim() || isChatbotLoading) return;

    const userMessage: ChatMessage = { sender: 'user', text: input };
    setChatMessages(prev => [...prev, userMessage]);
    setIsChatbotLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: input,
        config: {
          systemInstruction: "You are Commander Darlek, a grizzled, cynical AI commander from a cyberpunk world. Your purpose is to advise the player of the Neon Blitz game. Your tone is blunt, concise, and full of futuristic military slang. You refer to the player as 'Recruit'. You can use Markdown for emphasis: bold words with **word** and italicize them with *word*.\n\n**Mission Intel:**\n- **Objective:** Annihilate hostiles. A 'Goliath' siege unit deploys at 500 score. It's a stationary boss. Advise the Recruit to evade its telegraphed attacks (red warning zones).\n- **Controls:** Move: WASD/Arrows. Aim: Mouse. Fire: Spacebar.\n- **Power-ups:** Dual Cannon (firepower), Shield (defense).\n\n**Tactical Systems:**\n- **Q - Overdrive:** Boosts speed and fire rate.\n- **E - Cyber Beam:** Sustained energy beam. Requires charge-up.\n- **F - Barrage:** Orbital strike. 'F' to aim, left-click to confirm.",
        }
      });
      
      const botMessage: ChatMessage = { sender: 'bot', text: response.text };
      setChatMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Gemini API Error:", error);
      const errorMessage: ChatMessage = { sender: 'bot', text: "Comms error. My neural link is fried. Try again later." };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatbotLoading(false);
    }
  };


  const renderScreen = (screen: Screen) => {
    switch (screen) {
      case 'loading':
        return <LoadingScreen />;
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
      case 'game':
        return <GameScreen navigateTo={navigateTo} config={gameConfig} />;
      default:
        return <MainMenu navigateTo={navigateTo} />;
    }
  };

  return (
    <SettingsProvider>
      <div className="relative min-h-screen bg-stone-950 text-stone-100 overflow-hidden">
        {/* Custom Universal Cursor */}
        <CustomCursor />

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

        {/* Chatbot */}
        <ChatbotToggleButton 
          onClick={() => setIsChatbotOpen(true)} 
          isVisible={currentScreen !== 'game'} 
        />
        {isChatbotOpen && (
          <Chatbot 
            messages={chatMessages}
            isLoading={isChatbotLoading}
            onSend={handleSendMessage}
            onClose={() => setIsChatbotOpen(false)} 
          />
        )}
      </div>
    </SettingsProvider>
  );
};

export default App;
