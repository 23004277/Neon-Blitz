
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Settings, Difficulty, ControlScheme, Language } from '../types';

interface SettingsContextType {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

export const defaultSettings: Settings = {
  sound: true,
  music: true,
  soundVolume: 0.5,
  screenShake: true,
  difficulty: Difficulty.Medium,
  controls: ControlScheme.WASD,
  language: Language.English,
  playerName: 'VECTOR_01',
  playerColor: '#00F0FF',
  playerSecondaryColor: '#0066FF',
  playerColorStyle: 'neon',
  credits: 0,
  unlockedChassis: ['vector-01'],
  equippedChassis: 'vector-01',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('vector_siege_settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('vector_siege_settings', JSON.stringify(settings));
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
