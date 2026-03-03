
import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAudio } from '../contexts/AudioContext';
import { ControlScheme, Language, Screen, ColorStyle } from '../types';
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
  const [activeTab, setActiveTab] = useState<'audio' | 'gameplay' | 'visuals' | 'controls'>('audio');

  const handleSettingChange = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    audio.play('uiToggle');
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleBackToMenu = () => {
      audio.play('uiBack');
      navigateTo('main-menu');
  }

  const handleResume = () => {
      audio.play('uiClick');
      goBack();
  }
  
  return (
    <div className="fixed inset-0 bg-zinc-950 text-zinc-200 font-sans flex overflow-hidden z-50">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col relative z-20 shadow-2xl">
        <div className="p-8 border-b border-zinc-800">
          <h1 className="font-orbitron text-2xl font-black uppercase text-white tracking-widest">
            SETTINGS
          </h1>
          <div className="font-mono text-[10px] text-zinc-500 mt-2 uppercase tracking-widest">
            System Configuration
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {['audio', 'gameplay', 'visuals', 'controls'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                audio.play('uiClick');
                setActiveTab(tab as any);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 uppercase tracking-wider ${activeTab === tab ? 'bg-zinc-800 text-white shadow-inner border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-zinc-800 space-y-3 bg-zinc-900/50">
          <button 
            onClick={handleResume}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(5,150,105,0.3)] hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
          >
            Resume Game
          </button>
          <button 
            onClick={handleBackToMenu}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-colors border border-zinc-700"
          >
            Main Menu
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-12 bg-zinc-950 relative">
        {/* Background Grid & Scanlines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="grid-bg" />
        </div>
        
        <div className="max-w-2xl mx-auto animate-fade-in relative z-10">
          
          {activeTab === 'audio' && (
            <div className="space-y-8">
              <div>
                <h2 className="font-orbitron text-2xl font-bold text-white mb-6 tracking-wide border-b border-zinc-800 pb-4">AUDIO PROTOCOLS</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-zinc-900/80 rounded-xl border border-zinc-800 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-zinc-800 rounded-lg text-zinc-400"><SoundIcon /></div>
                      <div>
                        <div className="font-bold text-white uppercase tracking-wider text-sm">Sound Effects</div>
                        <div className="text-xs text-zinc-500 mt-1">Combat and UI sounds</div>
                      </div>
                    </div>
                    <ToggleSwitch checked={settings.sound} onChange={(c) => handleSettingChange('sound', c)} />
                  </div>
                  
                  <div className="flex items-center justify-between p-5 bg-zinc-900/80 rounded-xl border border-zinc-800 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-zinc-800 rounded-lg text-zinc-400"><MusicIcon /></div>
                      <div>
                        <div className="font-bold text-white uppercase tracking-wider text-sm">Music</div>
                        <div className="text-xs text-zinc-500 mt-1">Background tracks</div>
                      </div>
                    </div>
                    <ToggleSwitch checked={settings.music} onChange={(c) => handleSettingChange('music', c)} />
                  </div>

                  <div className={`p-6 bg-zinc-900/80 rounded-xl border border-zinc-800 backdrop-blur-sm transition-opacity ${settings.sound ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <Slider 
                      label="Master Volume"
                      value={settings.soundVolume}
                      onChange={(e) => handleSettingChange('soundVolume', parseFloat(e.target.value))}
                      min={0}
                      max={1}
                      step={0.01}
                      disabled={!settings.sound}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gameplay' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="font-orbitron text-2xl font-bold text-white mb-6 tracking-wide border-b border-zinc-800 pb-4">GAMEPLAY PARAMETERS</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-zinc-900/80 rounded-xl border border-zinc-800 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-zinc-800 rounded-lg text-zinc-400"><ScreenShakeIcon /></div>
                      <div>
                        <div className="font-bold text-white uppercase tracking-wider text-sm">Screen Shake</div>
                        <div className="text-xs text-zinc-500 mt-1">Immersive impact feedback</div>
                      </div>
                    </div>
                    <ToggleSwitch checked={settings.screenShake} onChange={(c) => handleSettingChange('screenShake', c)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'visuals' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="font-orbitron text-2xl font-bold text-white mb-6 tracking-wide border-b border-zinc-800 pb-4">VISUAL CUSTOMIZATION</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="p-5 bg-zinc-900/80 rounded-xl border border-zinc-800 backdrop-blur-sm space-y-4">
                    <label className="font-bold text-white uppercase tracking-wider text-sm block">Primary Color</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color" 
                        value={settings.playerColor}
                        onChange={(e) => handleSettingChange('playerColor', e.target.value)}
                        className="w-12 h-12 bg-transparent border border-zinc-700 rounded cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={settings.playerColor}
                        onChange={(e) => handleSettingChange('playerColor', e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-white uppercase focus:outline-none focus:border-zinc-600"
                      />
                    </div>
                  </div>
                  
                  <div className="p-5 bg-zinc-900/80 rounded-xl border border-zinc-800 backdrop-blur-sm space-y-4">
                    <label className="font-bold text-white uppercase tracking-wider text-sm block">Secondary Color</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color" 
                        value={settings.playerSecondaryColor}
                        onChange={(e) => handleSettingChange('playerSecondaryColor', e.target.value)}
                        className="w-12 h-12 bg-transparent border border-zinc-700 rounded cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={settings.playerSecondaryColor}
                        onChange={(e) => handleSettingChange('playerSecondaryColor', e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-white uppercase focus:outline-none focus:border-zinc-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-zinc-900/80 rounded-xl border border-zinc-800 backdrop-blur-sm">
                  <label className="font-bold text-white uppercase tracking-wider text-sm block mb-4">Color Style</label>
                  <SegmentedControl
                    name="colorStyle"
                    options={['solid', 'gradient', 'neon', 'chrome']}
                    value={settings.playerColorStyle}
                    onChange={(val) => handleSettingChange('playerColorStyle', val as ColorStyle)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="font-orbitron text-2xl font-bold text-white mb-6 tracking-wide border-b border-zinc-800 pb-4">INPUT & LOCALIZATION</h2>
                
                <div className="grid grid-cols-1 gap-6">
                  <div className="p-6 bg-zinc-900/80 rounded-xl border border-zinc-800 backdrop-blur-sm">
                    <label className="font-bold text-white uppercase tracking-wider text-sm block mb-4">Input Scheme</label>
                    <SegmentedControl
                      name="controls"
                      options={Object.values(ControlScheme)}
                      value={settings.controls}
                      onChange={(val) => handleSettingChange('controls', val as ControlScheme)}
                    />
                  </div>

                  <div className="p-6 bg-zinc-900/80 rounded-xl border border-zinc-800 backdrop-blur-sm">
                    <label className="font-bold text-white uppercase tracking-wider text-sm block mb-4">Interface Language</label>
                    <Select
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value as Language)}
                    >
                      {Object.values(Language).map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SettingsMenu;
