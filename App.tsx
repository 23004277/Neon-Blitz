
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
import Chatbot from './components/chatbot/Chatbot';
import ChatbotToggleButton from './components/chatbot/ChatbotToggleButton';
import CustomCursor from './components/game/CustomCursor';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

import type { Screen, ChatMessage, GameConfig } from './types';

const TRANSITION_DURATION = 400; // ms, should match CSS

const App: React.FC = () => {
  // New screen state management for smoother transitions
  const [currentScreen, setCurrentScreen] = useState<Screen>('loading');
  const [prevScreenForAnimation, setPrevScreenForAnimation] = useState<Screen | null>(null);
  const [screenToReturnTo, setScreenToReturnTo] = useState<Screen>('main-menu');
  
  // Game Configuration State
  const [gameConfig, setGameConfig] = useState<GameConfig>({ mode: 'campaign' });
  const [gameKey, setGameKey] = useState(0);

  // Chatbot state lifted to App component
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: "Commander Darlek online. Systems nominal. What is your query, Recruit?" }
  ]);
  const [isChatbotLoading, setIsChatbotLoading] = useState(false);

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

  const handleSendMessage = async (input: string) => {
    if (!input.trim() || isChatbotLoading) return;

    const userMessage: ChatMessage = { sender: 'user', text: input };
    setChatMessages(prev => [...prev, userMessage]);
    setIsChatbotLoading(true);
    
    // Add initial empty bot message for streaming
    setChatMessages(prev => [...prev, { sender: 'bot', text: '' }]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: input,
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
          systemInstruction: `You are **Commander Darlek**, a battle-hardened tactical AI integrated into the Vector Siege mainframe.
Your mission: Ensure the Pilot (user) survives the neon onslaught.
Your tone: Gritty, cynical, concise, and professional. Use cyberpunk military slang ("chrome", "cycles", "zeroed", "glitch", "meatbag").

**OPERATIONAL INTEL:**
1.  **Mission:** Survive endless waves in **Campaign Mode** or defeat a single target in **Duel Mode**.
2.  **Controls:** WASD to drive. Mouse to aim. Space to fire.

**TACTICAL SYSTEMS (HOTBAR):**
*   **[Q] OVERDRIVE:** Reroutes power to engines and guns. Increases speed/fire rate and **repairs hull integrity**.
*   **[E] CYBER BEAM:** High-output laser. **Hold [E] to charge**, release to incinerate. Penetrates targets.
*   **[R] FLUX MATRIX:** Defensive field. Converts incoming damage into **weapon charge**. Use when under heavy fire.
*   **[F] MISSILE BARRAGE:** Deploys seeker warheads. Good for crowd control.
*   **[Y] TESLA STORM:** Emits high-voltage arcs that automatically zap nearby enemies.
    *   **COMBAT TIP:** Activate **Overdrive** while **Tesla Storm** is active to double the zap frequency.

**SANDBOX MODE:**
*   **GOLIATH PRIME:** Select this chassis to access full boss weaponry (Railgun, Shockwave, Mortar, Laser Sweep).

**THREAT ASSESSMENT:**
*   **Basic Units:** Red tanks. Low threat.
*   **Tier 2:** Orange tanks. High aggression.
*   **Bosses:** Telegraph attacks with red zones. **Dodge or die.**

Keep responses under 3 sentences unless a full briefing is requested. Use **Bold** for emphasis.`,
        }
      });
      
      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        if (text) {
          setChatMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.sender === 'bot') {
              lastMsg.text += text;
            }
            return newMessages;
          });
        }
      }

    } catch (error) {
      console.error("Gemini API Error:", error);
      setChatMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg.sender === 'bot' && lastMsg.text === '') {
           lastMsg.text = "Connection severed. Neural link unstable. Try again.";
        } else {
           if (lastMsg.sender === 'bot') {
             lastMsg.text += "\n[CONNECTION LOST]";
           }
        }
        return newMessages;
      });
    } finally {
      setIsChatbotLoading(false);
    }
  };

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
            isVisible={currentScreen !== 'game' && currentScreen !== 'loading'} 
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
      </AudioProvider>
    </SettingsProvider>
  );
};

export default App;
