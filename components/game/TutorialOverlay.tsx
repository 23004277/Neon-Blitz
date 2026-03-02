import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudio } from '../../contexts/AudioContext';
import { useSettings } from '../../contexts/SettingsContext';
import CyberButton from '../common/CyberButton';
import { 
  Move, 
  MousePointer2, 
  Zap, 
  Shield, 
  Target, 
  ChevronRight, 
  XCircle,
  Keyboard,
  Mouse
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  highlight?: string; // CSS selector to highlight
  actionRequired?: 'WASD' | 'MOUSE_MOVE' | 'CLICK' | 'ABILITY' | 'NONE';
  spotlightShape?: 'circle' | 'rect';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'WELCOME PILOT',
    content: 'Welcome to the Vector Siege mainframe. You are the last line of defense against the neon onslaught. Let\'s get your systems calibrated.',
    icon: <Zap className="w-8 h-8 text-cyan-400" />,
    actionRequired: 'NONE'
  },
  {
    id: 'movement',
    title: 'MOVEMENT CONTROLS',
    content: 'Use [W, A, S, D] to navigate your chassis. Stay mobile to avoid incoming fire. Try moving now.',
    icon: <Keyboard className="w-8 h-8 text-cyan-400" />,
    actionRequired: 'WASD',
    highlight: '#game-canvas' // Highlight the arena
  },
  {
    id: 'aiming',
    title: 'TARGET ACQUISITION',
    content: 'Your turret follows your MOUSE cursor. Precision aiming is key. Move your mouse to aim.',
    icon: <MousePointer2 className="w-8 h-8 text-cyan-400" />,
    actionRequired: 'MOUSE_MOVE'
  },
  {
    id: 'shooting',
    title: 'PRIMARY ORDNANCE',
    content: 'Press [LEFT CLICK] or [SPACE] to fire your primary cannons. Try a test shot.',
    icon: <Target className="w-8 h-8 text-cyan-400" />,
    actionRequired: 'CLICK'
  },
  {
    id: 'abilities',
    title: 'TACTICAL ABILITIES',
    content: 'Your chassis has advanced systems. Use [Q, E, R, F, Y] to activate them. Check your hotbar.',
    icon: <Zap className="w-8 h-8 text-cyan-400" />,
    highlight: '.ability-hotbar',
    actionRequired: 'ABILITY',
    spotlightShape: 'rect'
  },
  {
    id: 'vitals',
    title: 'SHIELD SYSTEMS',
    content: 'Monitor your SHIELD status. If your hull integrity fails, the neural link will be severed.',
    icon: <Shield className="w-8 h-8 text-cyan-400" />,
    highlight: '.vitals-container',
    actionRequired: 'NONE',
    spotlightShape: 'rect'
  },
  {
    id: 'objectives',
    title: 'MISSION OBJECTIVES',
    content: 'Eliminate waves of hostile units to earn CREDITS. Watch the THREAT LEVEL indicator.',
    icon: <ChevronRight className="w-8 h-8 text-cyan-400" />,
    highlight: '.threat-level',
    actionRequired: 'NONE',
    spotlightShape: 'rect'
  },
  {
    id: 'ready',
    title: 'SYSTEMS ONLINE',
    content: 'Calibration complete. You are cleared for combat. Good luck, Pilot.',
    icon: <Zap className="w-8 h-8 text-cyan-400" />,
    actionRequired: 'NONE'
  }
];

interface TutorialOverlayProps {
  onComplete: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlight, setSpotlight] = useState<{ x: number; y: number; w: number; h: number; r: number } | null>(null);
  const [actionDone, setActionDone] = useState(false);
  const { setSettings } = useSettings();
  const audio = useAudio();

  const step = TUTORIAL_STEPS[currentStep];

  // Update spotlight position based on highlight selector
  useEffect(() => {
    const updateSpotlight = () => {
      if (step.highlight) {
        const el = document.querySelector(step.highlight);
        if (el) {
          const rect = el.getBoundingClientRect();
          setSpotlight({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            w: rect.width + 20,
            h: rect.height + 20,
            r: Math.max(rect.width, rect.height) / 2 + 20
          });
        }
      } else if (step.id === 'movement' || step.id === 'shooting' || step.id === 'aiming') {
        // Center spotlight for general gameplay steps
        setSpotlight({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          w: 200,
          h: 200,
          r: 150
        });
      } else {
        setSpotlight(null);
      }
    };

    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    return () => window.removeEventListener('resize', updateSpotlight);
  }, [step]);

  // Handle action-based progression
  useEffect(() => {
    if (step.actionRequired === 'NONE') {
      setActionDone(true);
      return;
    }

    setActionDone(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (step.actionRequired === 'WASD' && ['w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        setActionDone(true);
      }
      if (step.actionRequired === 'ABILITY' && ['q', 'e', 'r', 'f', 'y', 'Q', 'E', 'R', 'F', 'Y'].includes(e.key)) {
        setActionDone(true);
      }
      if (step.actionRequired === 'CLICK' && e.key === ' ') {
        setActionDone(true);
      }
    };

    const handleMouseDown = () => {
      if (step.actionRequired === 'CLICK') {
        setActionDone(true);
      }
    };

    const handleMouseMove = () => {
      if (step.actionRequired === 'MOUSE_MOVE') {
        setActionDone(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [step]);

  const handleNext = () => {
    if (!actionDone && step.actionRequired !== 'NONE') return;

    if (currentStep < TUTORIAL_STEPS.length - 1) {
      audio.play('uiClick');
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    audio.play('uiClick');
    handleComplete();
  };

  const handleComplete = () => {
    setSettings(prev => ({ ...prev, tutorialCompleted: true }));
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {/* Spotlight Mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlight && (
              step.spotlightShape === 'rect' ? (
                <rect 
                  x={spotlight.x - spotlight.w / 2} 
                  y={spotlight.y - spotlight.h / 2} 
                  width={spotlight.w} 
                  height={spotlight.h} 
                  rx="8"
                  fill="black" 
                />
              ) : (
                <circle 
                  cx={spotlight.x} 
                  cy={spotlight.y} 
                  r={spotlight.r} 
                  fill="black" 
                />
              )
            )}
          </mask>
        </defs>
        <rect 
          x="0" 
          y="0" 
          width="100%" 
          height="100%" 
          fill="rgba(0,0,0,0.8)" 
          mask="url(#tutorial-spotlight-mask)" 
          className="transition-all duration-500"
        />
      </svg>

      {/* Arrow Indicator */}
      <AnimatePresence>
        {spotlight && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute pointer-events-none z-[101]"
            style={{ 
              left: spotlight.x, 
              top: spotlight.y + (step.spotlightShape === 'rect' ? spotlight.h / 2 + 20 : spotlight.r + 20) 
            }}
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex flex-col items-center"
            >
              <div className="w-1 h-12 bg-cyan-500 shadow-[0_0_15px_#06b6d4]" />
              <div className="w-4 h-4 border-b-4 border-r-4 border-cyan-500 rotate-45 -mt-2 shadow-[0_0_15px_#06b6d4]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Card */}
      <motion.div
        key={currentStep}
        initial={{ scale: 0.9, opacity: 0, x: 100 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        exit={{ scale: 0.9, opacity: 0, x: -100 }}
        className={`relative w-full max-w-md bg-[#070b0e] border border-cyan-500/30 p-8 rounded-sm shadow-[0_0_50px_rgba(6,182,212,0.15)] pointer-events-auto z-[102] ${
          spotlight ? 'mt-[300px]' : ''
        }`}
      >
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500" />

        <div className="flex flex-col items-center text-center">
          <div className="mb-6 p-4 bg-cyan-500/10 rounded-full border border-cyan-500/20">
            {step.icon}
          </div>

          <h2 className="text-2xl font-orbitron font-black tracking-tighter text-white mb-4 italic">
            {step.title}
          </h2>

          <p className="text-stone-400 font-rajdhani text-lg leading-relaxed mb-8">
            {step.content}
          </p>

          <div className="flex flex-col w-full gap-4">
            <CyberButton 
              onClick={handleNext} 
              variant={actionDone ? "primary" : "secondary"} 
              className={`w-full py-4 text-lg transition-all duration-300 ${!actionDone ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!actionDone && step.actionRequired !== 'NONE'}
            >
              {currentStep === TUTORIAL_STEPS.length - 1 ? 'COMMENCE MISSION' : (actionDone ? 'CONTINUE' : 'WAITING FOR ACTION...')}
            </CyberButton>

            <button 
              onClick={handleSkip}
              className="text-stone-500 hover:text-cyan-400 text-xs font-mono uppercase tracking-widest transition-colors py-2"
            >
              Skip Tutorial
            </button>
          </div>

          {/* Progress Dots */}
          <div className="flex gap-2 mt-8">
            {TUTORIAL_STEPS.map((_, i) => (
              <div 
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-6 bg-cyan-500' : 'bg-stone-800'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TutorialOverlay;
