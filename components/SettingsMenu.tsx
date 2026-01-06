
import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAudio } from '../contexts/AudioContext';
import { ControlScheme, Language, Screen } from '../types';
import ToggleSwitch from './common/ToggleSwitch';
import SegmentedControl from './common/SegmentedControl';
import Select from './common/Select';
import Slider from './common/Slider';
import Fieldset from './common/Fieldset';
import { SoundIcon, MusicIcon, ScreenShakeIcon } from '../constants';

interface SettingsMenuProps {
  goBack: () => void;
  navigateTo: (screen: Screen) => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ goBack, navigateTo }) => {
  const { settings, setSettings } = useSettings();
  const audio = useAudio();

  const handleSettingChange = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    audio.play('uiToggle');
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleBack = () => {
      audio.play('uiBack');
      navigateTo('main-menu');
  }

  const handleSave = () => {
      audio.play('uiClick');
      goBack();
  }
  
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden bg-[var(--color-background)]">
      {/* Background Grid & Scanlines */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="grid-bg" />
        <div className="bg-tech-lines absolute inset-0" />
      </div>
      <div className="scanlines absolute inset-0 pointer-events-none opacity-30" />

      {/* Main Settings Panel */}
      <div className="relative z-10 w-full max-w-2xl animate-fade-in bg-black/80 backdrop-blur-md border border-[var(--color-primary-magenta)]/30 p-8 clip-corner-2 box-glow-magenta">
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[var(--color-primary-magenta)]"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[var(--color-primary-magenta)]"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[var(--color-primary-magenta)]"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[var(--color-primary-magenta)]"></div>
        
        {/* Title */}
        <div className="flex items-center justify-between mb-10 border-b border-[var(--color-primary-magenta)]/30 pb-4">
            <h1 className="font-orbitron text-4xl font-black uppercase text-[var(--color-primary-magenta)] text-glow-magenta tracking-widest">
            SYSTEM CONFIG
            </h1>
            <div className="font-rajdhani text-xs text-[var(--color-primary-magenta)] opacity-70 text-right">
                User: ADMIN<br/>
                Mode: ROOT_ACCESS
            </div>
        </div>
        
        <div className="flex flex-col gap-y-8">
          {/* Audio Section */}
          <Fieldset legend="Audio Protocols">
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-2 gap-x-8">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-sm border border-white/10">
                  <div className="flex items-center space-x-3">
                    <SoundIcon />
                    <span className="font-rajdhani text-lg text-[var(--color-text-light)] font-bold uppercase tracking-wide">Sound FX</span>
                  </div>
                  <ToggleSwitch 
                    checked={settings.sound}
                    onChange={(checked) => handleSettingChange('sound', checked)}
                  />
                </div>
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-sm border border-white/10">
                  <div className="flex items-center space-x-3">
                    <MusicIcon />
                    <span className="font-rajdhani text-lg text-[var(--color-text-light)] font-bold uppercase tracking-wide">Music</span>
                  </div>
                  <ToggleSwitch 
                    checked={settings.music}
                    onChange={(checked) => handleSettingChange('music', checked)}
                  />
                </div>
              </div>
              
              <div className={`transition-all duration-300 ${settings.sound ? 'opacity-100' : 'opacity-50 grayscale pointer-events-none'}`}>
                <Slider 
                  label="Master Vol"
                  value={settings.soundVolume}
                  onChange={(e) => handleSettingChange('soundVolume', parseFloat(e.target.value))}
                  min={0}
                  max={1}
                  step={0.01}
                  disabled={!settings.sound}
                />
              </div>
            </div>
          </Fieldset>

          {/* Gameplay Section */}
           <Fieldset legend="Gameplay Parameters">
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-sm border border-white/10">
              <div className="flex items-center space-x-3">
                <ScreenShakeIcon />
                <div className="flex flex-col">
                    <span className="font-rajdhani text-lg text-[var(--color-text-light)] font-bold uppercase tracking-wide">Screen Shake</span>
                    <span className="font-rajdhani text-xs text-stone-400">Enable for immersive impact feedback</span>
                </div>
              </div>
              <ToggleSwitch 
                checked={settings.screenShake}
                onChange={(checked) => handleSettingChange('screenShake', checked)}
              />
            </div>
          </Fieldset>

          {/* Controls & Language Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Fieldset legend="Input Scheme">
              <SegmentedControl
                name="controls"
                options={Object.values(ControlScheme)}
                value={settings.controls}
                onChange={(val) => handleSettingChange('controls', val as ControlScheme)}
              />
            </Fieldset>

            <Fieldset legend="Interface Lang">
              <Select
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value as Language)}
              >
                {Object.values(Language).map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </Select>
            </Fieldset>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-white/10">
          <button 
            onClick={handleBack}
            className="font-orbitron uppercase text-xs font-bold tracking-wider px-6 py-3 bg-transparent border border-stone-600 text-stone-400 hover:bg-stone-800 hover:text-white transition-all duration-300"
          >
            &lt; Return to Hub
          </button>
          <button 
            onClick={handleSave}
            className="font-orbitron uppercase text-sm font-bold tracking-wider px-10 py-3 bg-[var(--color-primary-magenta)] text-white shadow-[0_0_20px_rgba(255,0,60,0.4)] hover:bg-[var(--color-primary-magenta)] hover:shadow-[0_0_30px_rgba(255,0,60,0.6)] transition-all duration-300 clip-corner-4"
          >
            Save & Execute
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SettingsMenu;
