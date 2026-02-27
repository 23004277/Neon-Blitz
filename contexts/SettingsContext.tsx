
import React, { createContext, useState, useContext, ReactNode } from 'react';
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
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

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
