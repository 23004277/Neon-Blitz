
import React, { useState, useEffect, useRef } from 'react';
import type { Screen, Ability, Tank as TankType, Projectile, Vector, Animation, PowerUp, Boss, Telegraph, EffectZone, GameConfig, UIState, Minion, DamageNumber, PowerUpType, CutsceneState, KillFeedMessage, CombatText, Barrel, ChassisType } from '../../types';
import { Difficulty } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { useAudio } from '../../contexts/AudioContext';

import HUD from './HUD';
import AbilityHotbar from './AbilityHotbar';
import { drawTank, drawProjectile, drawGrid, drawAnimations, drawPowerUp, drawBoss, drawTelegraphs, drawEffectZones, drawDamageNumbers, drawCyberBeam, drawLastStandWarning, drawLaserSweep, loadGameAssets, drawCutsceneOverlay, drawBarrel } from './canvasRenderer';
import Leaderboard from './Leaderboard';
import { generateUsername } from './usernameGenerator';
import BossHealthBar from './BossHealthBar';
import GameOverScreen from './GameOverScreen';
import KillFeed from './KillFeed';
import SandboxPanel from './SandboxPanel';

// --- CONSTANTS ---
const ARENA_WIDTH = 1000;
const ARENA_HEIGHT = 700;
// Base speeds defined for 60 FPS
const PLAYER_SPEED = 3.5; 
const PROJECTILE_SPEED = 7;
const MISSILE_SPEED = 9;
const SPAWN_DELAY = 1000; // ms to stay in spawning state

// Internal Game State (Mutable)

interface InternalGameState {
    player: TankType;
    enemies: TankType[];
    bosses: Boss[];
    projectiles: Projectile[];
    powerUps: PowerUp[];
    animations: Animation[];
    telegraphs: Telegraph[];
    effectZones: EffectZone[];
    minions: Minion[];
    damageNumbers: DamageNumber[];
    barrels: Barrel[];
    combatText: CombatText[];
    killFeed: KillFeedMessage[];
    lastTime: number;
    keys: Record<string, boolean>;
    mouse: Vector;
    screenShake: number;
    wave: number;
    abilities: Ability[];
    activeAbilityId: string | null;
    lastPowerUpTime: number;
    lastEnemySpawnTime: number;
    lastBeamTick: number; // For Beam damage throttling
    lastBossBeamTick: number; // For Boss Laser damage
    lastSyncedEnemiesRemaining: number; // To prevent excessive re-renders
    lastSyncedScore: number;
    lastSyncedPlayerHealth: number;
    lastSyncedPlayerShield: number;
    lastSyncedCharge: number;
    
    // Sandbox Settings
    sandbox: {
        godMode: boolean;
        infiniteEnergy: boolean;
        timeScale: number;
        spawnMode: string;
    };
    
    // Cinematic State
    cutscene: CutsceneState;
    camera: { x: number, y: number, zoom: number };
}

const initialPlayer: TankType = {
    id: 'player', name: 'Player', type: 'player', status: 'spawning', spawnTime: 0,
    position: { x: ARENA_WIDTH/2, y: ARENA_HEIGHT-100 }, velocity: {x:0, y:0},
    angle: -90, turretAngle: -90, size: {width:40, height:40}, 
    health: 10, maxHealth: 10, color: '#00E0FF', score: 0, kills: 0, deaths: 0,
    damageConverterCharge: 0,
    critChance: 0.1,
    critMultiplier: 2
};

// Difficulty Configuration Helper
const getDifficultyConfig = (difficulty: Difficulty) => {
    switch (difficulty) {
        case Difficulty.Hard:
            return {
                maxEnemiesBase: 7,
                spawnInterval: 1200,
                hpMultiplier: 1.5,
                speedMultiplier: 1.3,
                fireRateMultiplier: 0.7, // Lower is faster
                tierChance: 0.5, // 50% chance for intermediate
                bossHpMultiplier: 1.5,
                bossAggression: 1.5, 
                aiTracking: 0.15 // Sharp turns
            };
        case Difficulty.Medium:
            return {
                maxEnemiesBase: 5,
                spawnInterval: 2200,
                hpMultiplier: 1.2,
                speedMultiplier: 1.1,
                fireRateMultiplier: 0.9,
                tierChance: 0.3,
                bossHpMultiplier: 1.2,
                bossAggression: 1.2,
                aiTracking: 0.12
            };
        case Difficulty.Easy:
        default:
            return {
                maxEnemiesBase: 3,
                spawnInterval: 3500,
                hpMultiplier: 1.0,
                speedMultiplier: 1.0,
                fireRateMultiplier: 1.2, // Slower fire
                tierChance: 0.1,
                bossHpMultiplier: 1.0,
                bossAggression: 1.0,
                aiTracking: 0.08
            };
    }
};

const getOffsetPoint = (origin: Vector, angle: number, fwd: number, lat: number) => {
    const rad = angle * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
        x: origin.x + (fwd * cos - lat * sin),
        y: origin.y + (fwd * sin + lat * cos)
    };
};

const GameScreen: React.FC<{ navigateTo: (screen: Screen) => void, config: GameConfig }> = ({ navigateTo, config }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { settings } = useSettings();
    const audio = useAudio();
    
    // Get stats based on current difficulty setting
    const diffConfig = getDifficultyConfig(settings.difficulty);

    // Mutable Game State
    const game = useRef<InternalGameState>({
        player: { ...initialPlayer, spawnTime: Date.now() },
        enemies: [],
        bosses: [],
        projectiles: [],
        powerUps: [],
        animations: [],
        telegraphs: [],
        effectZones: [],
        minions: [],
        damageNumbers: [],
        barrels: [],
        combatText: [],
        killFeed: [],
        lastTime: Date.now(),
        keys: {},
        mouse: { x: 0, y: 0 },
        screenShake: 0,
        wave: 1,
        abilities: [
           { id: 'overdrive', name: 'Overdrive', keyBinding: 'Q', state: 'ready', duration: 8000, cooldown: 20000, startTime: 0 }, { id: 'cyberBeam', name: 'Cyber Beam', keyBinding: 'E', state: 'ready', duration: 6000, cooldown: 12000, startTime: 0, chargeDuration: 1500 }, { id: 'damageConverter', name: 'Flux Matrix', keyBinding: 'R', state: 'ready', duration: 6000, cooldown: 18000, startTime: 0 }, { id: 'missileBarrage', name: 'Missile Barrage', keyBinding: 'F', state: 'ready', duration: 1000, cooldown: 15000, startTime: 0, firedCount: 0 }, { id: 'teslaStorm', name: 'Tesla Storm', keyBinding: 'Y', state: 'ready', duration: 6000, cooldown: 25000, startTime: 0, firedCount: 0 },
        ],
        activeAbilityId: null,
        lastPowerUpTime: Date.now(),
        lastEnemySpawnTime: Date.now(),
        lastBeamTick: 0,
        lastBossBeamTick: 0,
        lastSyncedEnemiesRemaining: 0,
        lastSyncedScore: 0,
        lastSyncedPlayerHealth: initialPlayer.health,
        lastSyncedPlayerShield: 0,
        lastSyncedCharge: 0,
        sandbox: {
            godMode: false,
            infiniteEnergy: false,
            timeScale: 1.0,
            spawnMode: 'none'
        },
        
        // Cinematic Init
        cutscene: {
            active: false,
            phase: 'intro',
            startTime: 0,
            dialogueText: '',
            dialogueIndex: 0,
            targetCamera: { x: ARENA_WIDTH/2, y: ARENA_HEIGHT/2, zoom: 1 }
        },
        camera: { x: ARENA_WIDTH/2, y: ARENA_HEIGHT/2, zoom: 1 }
    });

    const [uiState, setUiState] = useState<UIState>({
        playerHealth: 10, playerMaxHealth: 10, playerShield: 0, playerScore: 0, playerKills: 0,
        wave: 1, enemiesRemaining: 0, gameOver: false, duelWon: false, abilities: [], damageConverterCharge: 0
    });

    const [isSandboxPanelOpen, setIsSandboxPanelOpen] = useState(false);

    useEffect(() => {
        if (uiState.gameOver) {
            audio.setGlobalFilter(600);
        } else if (uiState.playerHealth / uiState.playerMaxHealth < 0.3) {
            audio.setGlobalFilter(1200);
        } else {
            audio.setGlobalFilter(22000);
        }
    }, [uiState.gameOver, uiState.playerHealth, uiState.playerMaxHealth, audio]);

    // --- HELPER FUNCTIONS ---
    const applyDamage = (target: TankType | Boss, amount: number, sourceId?: string) => {
         if (target.status !== 'active') return;
         if ('isInvulnerable' in target && target.isInvulnerable) return;
         
         // Sandbox: God Mode
         if (target.id === 'player' && game.current.sandbox.godMode) return;

         let finalDamage = amount;
         
         // Shield Check
         if (target.shieldHealth && target.shieldHealth > 0) {
             target.shieldHealth -= amount;
             audio.play('shieldHit');
             game.current.animations.push({ id: `shield-hit-${Date.now()}-${Math.random()}`, type: 'shieldHit', position: target.position, createdAt: Date.now(), duration: 300, color: '#06b6d4' });
             
             if (target.shieldHealth <= 0) {
                 audio.play('shieldBreak');
                 game.current.animations.push({ id: `shield-break-${Date.now()}-${Math.random()}`, type: 'shieldBreak', position: target.position, createdAt: Date.now(), duration: 600, color: '#06b6d4' });
                 target.shieldHealth = 0; // Clamp
             }
             return; // Shield absorbed damage (or broke, but health untouched for this hit)
         }
         
         target.health -= finalDamage;
         target.lastHitTime = Date.now();
         
         if (target.id === 'player') {
             // UI synced in update loop
             audio.play('impact_player', target.position.x);
             game.current.damageNumbers.push({ id: `dmg-p-${Date.now()}-${Math.random()}`, text: Math.round(finalDamage).toString(), position: { ...target.position, y: target.position.y - 30 }, createdAt: Date.now(), duration: 800, color: '#ff0000' });
             game.current.screenShake = Math.max(game.current.screenShake, 5);
         } else {
             audio.play('impact_damage', target.position.x);
             game.current.damageNumbers.push({ id: `dmg-${Date.now()}-${Math.random()}`, text: Math.round(finalDamage).toString(), position: { x: target.position.x + (Math.random() * 40 - 20), y: target.position.y - 40 }, createdAt: Date.now(), duration: 800, color: '#ffffff' });
         }
         
         if (target.health <= 0) {
             if ('type' in target && target.type === 'enemy') handleEnemyDeath(target as TankType);
             else if ('bossType' in target) {
                  // Boss Death
                  target.status = 'dead';
                  game.current.animations.push({ id: `b-die-${Date.now()}`, type: 'explosion', position: target.position, createdAt: Date.now(), duration: 1000, color: 'red' });
                  audio.play('bossExplosion');
                  audio.stopEngine('boss');
                  setTimeout(() => { game.current.boss = null; }, 1000);
             }
         }
    };

    const spawnPowerUp = (position: Vector) => {
        // 50% chance normally, 100% in sandbox for fun/testing
        if (config.mode !== 'sandbox' && Math.random() > 0.50) return; 

        const types: PowerUpType[] = ['dualCannon', 'shield', 'regensule', 'lifeLeech', 'homingMissiles'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        game.current.powerUps.push({
            id: `pup-${Date.now()}-${Math.random()}`,
            type,
            position: { ...position },
            spawnTime: Date.now()
        });
    };

    const applyPowerUp = (tank: TankType, type: PowerUpType) => {
        const isOverdrive = tank.chassis === 'goliath-prime-overdrive';
        
        // Initialize array if undefined
        if (!tank.activePowerUps) tank.activePowerUps = [];

        // UNIQUE INTERACTION: True Form Goliath Power-up Overrides
        if (isOverdrive) {
            if (type === 'regensule') {
                // Massive Heal instead of trickling
                const healAmt = Math.floor(tank.maxHealth * 0.5);
                tank.health = Math.min(tank.maxHealth, tank.health + healAmt);
                game.current.damageNumbers.push({
                    id: `pup-heal-true-${Date.now()}`, text: `+${healAmt}`, position: { ...tank.position, y: tank.position.y - 60 }, createdAt: Date.now(), duration: 1500, color: '#22c55e'
                });
                audio.play('abilityReady'); // Heavier sound
                return; // Instant consume
            }
            if (type === 'shield') {
                // Reactive Super Shield (visuals handled in drawTank via tank.activePowerUps)
                if (!tank.activePowerUps.includes(type)) tank.activePowerUps.push(type);
                tank.powerUpExpireTime = Date.now() + 20000;
                tank.shieldHealth = (tank.shieldHealth || 0) + 10; // Stack shield
                return;
            }
            if (type === 'homingMissiles') {
                // Swarm reload
                if (!tank.activePowerUps.includes(type)) tank.activePowerUps.push(type);
                tank.powerUpExpireTime = Date.now() + 20000;
                tank.homingMissileCount = (tank.homingMissileCount || 0) + 30; // Stack count
                return;
            }
            // Dual Cannon behaves as "Quad Cannon" in fireProjectile
            // Life Leech is standard but stronger due to damage output
        }

        // Standard Powerups
        if (!tank.activePowerUps.includes(type)) {
            tank.activePowerUps.push(type);
        }
        tank.powerUpExpireTime = Date.now() + 15000; // 15s duration (refreshes all)
        
        if (type === 'shield') tank.shieldHealth = (tank.shieldHealth || 0) + 5;
        if (type === 'homingMissiles') tank.homingMissileCount = (tank.homingMissileCount || 0) + 10;
        
        // Instant visual feedback
        game.current.animations.push({
            id: `pup-pickup-${Date.now()}`,
            type: 'shieldHit', // Reusing shield hit ring effect for pickup pulse
            position: tank.position,
            createdAt: Date.now(),
            duration: 500,
            color: '#fff'
        });
    };

    const handleEnemyDeath = (e: TankType) => {
        const g = game.current;
        if (e.status === 'dying' || e.status === 'dead') return;

        g.killFeed.push({
            id: `kf-${e.id}-${Date.now()}`,
            killerName: g.player.name,
            victimName: e.name,
            killerColor: g.player.color,
            victimColor: e.color,
            createdAt: Date.now(),
        });

        e.status = 'dead';
        game.current.player.score += 50;
        // Score synced in update loop
        
        audio.play('explosion', e.position.x);
        game.current.animations.push({ 
            id: `e-die-${Date.now()}-${Math.random()}`, 
            type: 'explosion', 
            position: e.position, 
            createdAt: Date.now(), 
            duration: 500, 
            color: '#f97316' 
        });
        
        game.current.screenShake = Math.max(game.current.screenShake, 5);
        audio.stopEngine(e.id);
        
        spawnPowerUp(e.position);
    };

    // --- CINEMATIC SEQUENCER ---
    const updateCutscene = (now: number, dt: number) => {
        const g = game.current;
        const c = g.cutscene;
        const cam = g.camera;

        if (!c.active) return;
        
        const dialogue1 = "Do you really think you can beat me this easily?";
        const dialogue2 = "Allow me to demonstrate true power!";

        // Phase Logic
        if (c.phase === 'intro') {
            // Zoom into player
            c.targetCamera = { x: g.player.position.x, y: g.player.position.y, zoom: 2.0 };
            const elapsed = now - c.startTime;
            if (elapsed > 1000) {
                c.phase = 'dialogue';
                c.startTime = now;
                c.dialogueText = dialogue1;
                c.dialogueIndex = 0;
            }
        } else if (c.phase === 'dialogue') {
            // Typewriter effect
            if (c.dialogueIndex < c.dialogueText.length) {
                // Slower speed for drama: 0.03 characters per ms roughly
                const currentChar = c.dialogueText[Math.floor(c.dialogueIndex)];
                let speed = 0.03 * dt;
                
                // Pause for dramatic punctuation
                if (['.', '!', '?'].includes(currentChar)) {
                    speed *= 0.1; // 10x slower on punctuation
                }

                const oldIdx = Math.floor(c.dialogueIndex);
                c.dialogueIndex += speed;
                const newIdx = Math.floor(c.dialogueIndex);
                
                if (newIdx > oldIdx) {
                     // Use True Form Voice
                     if (newIdx % 3 === 0) audio.play('trueFormVoice'); 
                }
            } else {
                // Wait for a bit then switch text or phase
                const elapsed = now - c.startTime;
                
                if (c.dialogueText === dialogue1 && elapsed > 4000) { // Longer read time
                     c.dialogueText = dialogue2;
                     c.dialogueIndex = 0;
                     c.startTime = now;
                } else if (c.dialogueText === dialogue2 && elapsed > 3500) {
                     c.phase = 'transform';
                     c.startTime = now;
                     // Trigger FX
                     audio.play('transformCharge');
                }
            }
        } else if (c.phase === 'transform') {
            // Shake and Flash
            g.screenShake = 5 + Math.random() * 5;
            const elapsed = now - c.startTime;
            
            // Render the implosion charge effect during this phase (draw logic handles it via animation list)
            // But we need to add the animation once
            if (elapsed < 100) {
                 g.animations.push({
                     id: `tf-charge-${now}`, type: 'transformCharge', position: g.player.position, createdAt: now, duration: 1500
                });
            }
            
            if (elapsed > 1500 && g.player.chassis !== 'goliath-prime-overdrive') {
                // THE MOMENT OF TRANSFORMATION
                g.player.chassis = 'goliath-prime-overdrive';
                g.player.color = '#b91c1c'; // Dark red
                g.player.maxHealth += 500;
                g.player.health = g.player.maxHealth;
                g.player.size = { width: 120, height: 120 }; // Bigger
                
                audio.play('transformBang');
                g.screenShake = 60;
                g.animations.push({
                     id: `tf-flash-${now}`, type: 'transformFlash', position: g.player.position, createdAt: now, duration: 1000
                });
                
                // Add Overdrive ability permanently active visual or logic?
                // Just use the chassis type in renderer to draw it special
            }
            
            if (elapsed > 3000) {
                c.phase = 'outro';
                c.startTime = now;
            }
        } else if (c.phase === 'outro') {
            // Zoom out
            c.targetCamera = { x: ARENA_WIDTH/2, y: ARENA_HEIGHT/2, zoom: 1.0 };
            
            // Camera lerp handled below
            // Check if camera is close enough to reset
            if (Math.abs(cam.zoom - 1.0) < 0.05) {
                c.active = false;
                // Restore game flow
                setUiState(prev => ({ 
                    ...prev, 
                    playerHealth: g.player.health, 
                    playerMaxHealth: g.player.maxHealth 
                }));
            }
        }

        // Camera Smoothing
        const lerp = 0.05;
        cam.x += (c.targetCamera.x - cam.x) * lerp;
        cam.y += (c.targetCamera.y - cam.y) * lerp;
        cam.zoom += (c.targetCamera.zoom - cam.zoom) * lerp;
    };


    // --- LOOP ---
    useEffect(() => {
        loadGameAssets(); // Initialize assets
        let rafId: number;
        
        // Reset state on mount
        game.current.lastTime = Date.now();
        game.current.player.spawnTime = Date.now();
        game.current.player.status = 'spawning';

        // --- SANDBOX INITIALIZATION ---
        if (config.mode === 'sandbox' && config.sandboxConfig) {
             const { characterId } = config.sandboxConfig;
             
             // Initialize Player Stats based on selection
             if (characterId === 'rogue-scout') {
                 game.current.player.maxHealth = 5;
                 game.current.player.health = 5;
                 game.current.player.size = { width: 30, height: 30 };
                 game.current.player.color = '#00F0FF';
                 game.current.player.chassis = 'rogue-scout';
                 game.current.abilities = [
                     { id: 'phaseShift', name: 'Phase Shift', keyBinding: 'Q', state: 'ready', duration: 3000, cooldown: 12000, startTime: 0 },
                     { id: 'nanoSwarm', name: 'Nano Swarm', keyBinding: 'E', state: 'ready', duration: 1500, cooldown: 14000, startTime: 0 },
                     { id: 'overdrive', name: 'Overdrive', keyBinding: 'R', state: 'ready', duration: 6000, cooldown: 15000, startTime: 0 }
                 ];
             } else if (characterId === 'iron-bastion') {
                 game.current.player.maxHealth = 25;
                 game.current.player.health = 25;
                 game.current.player.size = { width: 50, height: 50 };
                 game.current.player.tier = 'intermediate';
                 game.current.player.color = '#f97316';
                 game.current.player.chassis = 'iron-bastion';
                 game.current.abilities = [
                     { id: 'prismGuard', name: 'Prism Guard', keyBinding: 'Q', state: 'ready', duration: 5000, cooldown: 15000, startTime: 0 },
                     { id: 'shockwave', name: 'Shockwave', keyBinding: 'E', state: 'ready', duration: 500, cooldown: 8000, startTime: 0 },
                     { id: 'mortarVolley', name: 'Mortar Volley', keyBinding: 'R', state: 'ready', duration: 1000, cooldown: 12000, startTime: 0 },
                     { id: 'damageConverter', name: 'Flux Matrix', keyBinding: 'F', state: 'ready', duration: 6000, cooldown: 20000, startTime: 0 }
                 ];
             } else if (characterId === 'goliath-prime') {
                 game.current.player.maxHealth = 200;
                 game.current.player.health = 200;
                 game.current.player.size = { width: 100, height: 100 }; // Big!
                 game.current.player.bossType = 'goliath';
                 game.current.player.color = '#ef4444';
                 game.current.player.chassis = 'goliath-prime';
                 
                 // REPLACE ABILITIES WITH EXPANDED BOSS MOVESET
                 game.current.abilities = [
                     { id: 'shockwave', name: 'Shockwave', keyBinding: 'Q', state: 'ready', duration: 500, cooldown: 5000, startTime: 0 },
                     { id: 'omniBarrage', name: 'Omni Barrage', keyBinding: 'E', state: 'ready', duration: 500, cooldown: 10000, startTime: 0, chargeDuration: 1500 }, // New replacement skill
                     { id: 'mortarVolley', name: 'Mortar Volley', keyBinding: 'R', state: 'ready', duration: 1000, cooldown: 10000, startTime: 0 },
                     { id: 'laserSweep', name: 'Laser Sweep', keyBinding: 'F', state: 'ready', duration: 8500, cooldown: 15000, startTime: 0 }, // Matched to boss nerf duration
                     { id: 'scatterMines', name: 'Scatter Mines', keyBinding: 'T', state: 'ready', duration: 500, cooldown: 12000, startTime: 0 },
                     { id: 'nanoSwarm', name: 'Nano Swarm', keyBinding: 'Y', state: 'ready', duration: 1500, cooldown: 14000, startTime: 0 }
                 ];
             } else if (characterId === 'phantom-weaver') {
                 game.current.player.maxHealth = 8;
                 game.current.player.health = 8;
                 game.current.player.size = { width: 35, height: 35 };
                 game.current.player.color = '#a855f7';
                 game.current.player.chassis = 'phantom-weaver';
                 game.current.player.tier = 'intermediate';
                 game.current.abilities = [
                     { id: 'phaseShift', name: 'Phase Shift', keyBinding: 'Q', state: 'ready', duration: 3000, cooldown: 12000, startTime: 0 },
                 ];
             } else if (characterId === 'titan-ogre') {
                 game.current.player.maxHealth = 40;
                 game.current.player.health = 40;
                 game.current.player.size = { width: 60, height: 60 };
                 game.current.player.color = '#166534';
                 game.current.player.chassis = 'titan-ogre';
                 game.current.player.tier = 'intermediate';
                 game.current.abilities = [
                     { id: 'shockwave', name: 'Shockwave', keyBinding: 'Q', state: 'ready', duration: 500, cooldown: 8000, startTime: 0 },
                     { id: 'mortarVolley', name: 'Mortar Volley', keyBinding: 'E', state: 'ready', duration: 1000, cooldown: 12000, startTime: 0 },
                     { id: 'missileBarrage', name: 'Missile Barrage', keyBinding: 'R', state: 'ready', duration: 1000, cooldown: 15000, startTime: 0 },
                     { id: 'damageConverter', name: 'Flux Matrix', keyBinding: 'F', state: 'ready', duration: 6000, cooldown: 20000, startTime: 0 }
                 ];
             } else if (characterId === 'volt-strider') {
                 game.current.player.maxHealth = 12;
                 game.current.player.health = 12;
                 game.current.player.size = { width: 38, height: 38 };
                 game.current.player.color = '#eab308';
                 game.current.player.chassis = 'volt-strider';
                 game.current.player.tier = 'intermediate';
                 game.current.abilities = [
                     { id: 'teslaStorm', name: 'Tesla Storm', keyBinding: 'Q', state: 'ready', duration: 6000, cooldown: 20000, startTime: 0 },
                     { id: 'chainLightning', name: 'Chain Lightning', keyBinding: 'E', state: 'ready', duration: 500, cooldown: 8000, startTime: 0 },
                     { id: 'overdrive', name: 'Overdrive', keyBinding: 'R', state: 'ready', duration: 6000, cooldown: 15000, startTime: 0 },
                     { id: 'cyberBeam', name: 'Cyber Beam', keyBinding: 'F', state: 'ready', duration: 6000, cooldown: 12000, startTime: 0, chargeDuration: 1500 }
                 ];
             } else if (characterId === 'inferno-cobra') {
                 game.current.player.maxHealth = 15;
                 game.current.player.health = 15;
                 game.current.player.size = { width: 42, height: 42 };
                 game.current.player.color = '#ef4444';
                 game.current.player.chassis = 'inferno-cobra';
                 game.current.player.tier = 'intermediate';
                 game.current.abilities = [
                     { id: 'flamethrower', name: 'Flamethrower', keyBinding: 'Q', state: 'ready', duration: 3000, cooldown: 10000, startTime: 0 },
                     { id: 'toxicRounds', name: 'Napalm Rounds', keyBinding: 'E', state: 'ready', duration: 500, cooldown: 12000, startTime: 0 },
                     { id: 'missileBarrage', name: 'Missile Barrage', keyBinding: 'R', state: 'ready', duration: 1000, cooldown: 15000, startTime: 0 },
                     { id: 'overdrive', name: 'Overdrive', keyBinding: 'F', state: 'ready', duration: 6000, cooldown: 15000, startTime: 0 }
                 ];
             } else if (characterId === 'crystal-vanguard') {
                 game.current.player.maxHealth = 20;
                 game.current.player.health = 20;
                 game.current.player.size = { width: 45, height: 45 };
                 game.current.player.color = '#06b6d4';
                 game.current.player.chassis = 'crystal-vanguard';
                 game.current.player.tier = 'intermediate';
                 game.current.abilities = [
                     { id: 'prismGuard', name: 'Prism Guard', keyBinding: 'Q', state: 'ready', duration: 5000, cooldown: 15000, startTime: 0 },
                     { id: 'laserSweep', name: 'Laser Sweep', keyBinding: 'E', state: 'ready', duration: 4000, cooldown: 18000, startTime: 0 },
                     { id: 'cyberBeam', name: 'Cyber Beam', keyBinding: 'R', state: 'ready', duration: 6000, cooldown: 12000, startTime: 0, chargeDuration: 1500 },
                     { id: 'damageConverter', name: 'Flux Matrix', keyBinding: 'F', state: 'ready', duration: 6000, cooldown: 20000, startTime: 0 }
                 ];
             }
             // Vector-01 uses defaults
             game.current.player.status = 'active';
             // Sync UI
             setUiState(prev => ({ 
                 ...prev, 
                 playerHealth: game.current.player.health, 
                 playerMaxHealth: game.current.player.maxHealth,
                 abilities: [...game.current.abilities]
             }));
        }

        // --- DUEL MODE INITIALIZATION ---
        if (config.mode === 'duel' && config.duelConfig) {
            const { opponentType, tier, bossType, opponentName, chassis } = config.duelConfig;
            
            // Set Player to Active immediately for Duel
            game.current.player.status = 'active';
            
            if (opponentType === 'boss') {
                spawnBoss(bossType || 'goliath');
                if (game.current.boss) {
                    game.current.boss.status = 'active'; // Skip spawn anim
                    game.current.boss.spawnTime = 0;
                }
            } else {
                spawnDuelEnemy(opponentName, tier, chassis);
            }
        }

        const loop = (time: number) => {
            if (!canvasRef.current) return;
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;

            // Calculate Delta Time
            const now = time;
            const dt = Math.min(now - game.current.lastTime, 50); // Cap at 50ms to prevent huge jumps
            game.current.lastTime = now;

            update(dt);
            draw(ctx);

            if (!game.current.player.health || game.current.player.health <= 0) {
                if (!game.current.player.deathTime) {
                    game.current.player.deathTime = Date.now();
                    game.current.player.status = 'dead';
                    setUiState(prev => ({ ...prev, gameOver: true }));
                    audio.play('explosion');
                    audio.stopMusic();
                    // Stop any active loops
                    audio.stop('overdriveLoop');
                    audio.stop('beamCharge');
                    audio.stop('omniCharge'); // Added
                    audio.stop('beamFire');
                    audio.stop('bossLaserLoop');
                    audio.stopEngine('player'); // Stop engine sound
                    if (game.current.boss) audio.stopEngine('boss');
                }
            } else {
                rafId = requestAnimationFrame(loop);
            }
        };

        rafId = requestAnimationFrame(loop);
        
        // Initial Music State
        audio.startMusic();
        audio.setMusicState(config.mode === 'duel' ? 'boss' : 'ambient');

        return () => {
            cancelAnimationFrame(rafId);
            audio.stopMusic(); // Stops music interval + scheduled nodes
            audio.stopAllLoops(); // Robust cleanup of all looping SFX
            audio.stopAllEngines(); // Robust cleanup of all engine hums
        };
    }, [config]);

    // --- UPDATE LOGIC ---
    const update = (dt: number) => {
        const now = Date.now();
        const g = game.current;
        const player = g.player;

        // Cutscene Update
        if (g.cutscene.active) {
            updateCutscene(now, dt);
            return; // STOP PHYSICS
        }

        // Normalization factor: target 60 FPS (16.67ms per frame)
        const timeScale = (dt / 16.67) * g.sandbox.timeScale; 

        // 0. State Transitions (Spawning -> Active)
        if (player.status === 'spawning' && player.spawnTime && now > player.spawnTime + SPAWN_DELAY) {
            player.status = 'active';
        }
        g.enemies.forEach(e => {
            if (e.status === 'spawning' && e.spawnTime && now > e.spawnTime + SPAWN_DELAY) {
                e.status = 'active';
            }
            // Regen powerup logic
            if (e.status === 'active' && e.activePowerUps?.includes('regensule') && e.health < e.maxHealth) {
                e.health = Math.min(e.maxHealth, e.health + (2 * dt) / 1000);
            }
        });
        if (g.boss && g.boss.status === 'spawning' && g.boss.spawnTime && now > g.boss.spawnTime + SPAWN_DELAY*2) {
            g.boss.status = 'active';
        }

        // Dynamic Music State Check
        if (g.bosses.length > 0) {
            audio.setMusicState('boss');
        } else if (g.enemies.length > 2) {
            audio.setMusicState('combat');
        } else {
            audio.setMusicState('ambient');
        }

        // Damage Converter Charge Decay
        if (player.damageConverterCharge && player.damageConverterCharge > 0) {
            player.damageConverterCharge = Math.max(0, player.damageConverterCharge - (dt / 1000) * 5);
        }
        
        

        // UI Throttling
        const currentChargeInt = Math.floor(player.damageConverterCharge || 0);
        const prevChargeInt = Math.floor(uiState.damageConverterCharge || 0);
        if (currentChargeInt !== prevChargeInt) {
             setUiState(prev => ({...prev, damageConverterCharge: player.damageConverterCharge || 0}));
        }

        // 3. Powerups Logic
        if (player.activePowerUps && player.activePowerUps.length > 0 && player.powerUpExpireTime && now > player.powerUpExpireTime) {
            player.activePowerUps = [];
            player.powerUpExpireTime = undefined;
            audio.play('uiBack'); // Power down sound
            player.shieldHealth = 0;
            player.homingMissileCount = 0;
        }

        // Player Passive Effects
        if (player.status === 'active' && player.activePowerUps?.includes('regensule') && player.health < player.maxHealth) {
             player.health = Math.min(player.maxHealth, player.health + (5 * dt) / 1000);
             setUiState(prev => ({...prev, playerHealth: player.health}));
        }

        // Check PowerUp Pickups
        game.current.powerUps = game.current.powerUps.filter(p => {
            // Player Pickup
            const dist = Math.hypot(player.position.x - p.position.x, player.position.y - p.position.y);
            const pickupRadius = player.bossType === 'goliath' ? 80 : player.size.width; // Larger pickup radius for Goliath
            if (dist < pickupRadius) {
                applyPowerUp(player, p.type);
                audio.play('abilityReady');
                game.current.damageNumbers.push({
                    id: `pup-text-${Date.now()}`,
                    text: p.type.toUpperCase(),
                    position: { ...player.position, y: player.position.y - 50 },
                    createdAt: Date.now(),
                    duration: 1000,
                    color: '#fff'
                });
                return false; 
            }

            // Enemy Pickup
            for (const enemy of game.current.enemies) {
                if (enemy.status !== 'active') continue;
                const eDist = Math.hypot(enemy.position.x - p.position.x, enemy.position.y - p.position.y);
                if (eDist < enemy.size.width) {
                    applyPowerUp(enemy, p.type);
                    // Optional: Play a sound or show text for enemy pickup
                    game.current.damageNumbers.push({
                        id: `pup-text-${Date.now()}-${enemy.id}`,
                        text: p.type.toUpperCase(),
                        position: { ...enemy.position, y: enemy.position.y - 40 },
                        createdAt: Date.now(),
                        duration: 1000,
                        color: '#ef4444' // Red for enemy
                    });
                    return false;
                }
            }

            return true;
        });
        
        // --- PLAYER MINE DETECTION ---
        // Enhanced Logic: If True Form, mines move towards enemies
        const isTrueForm = player.chassis === 'goliath-prime-overdrive';
        
        g.telegraphs = g.telegraphs.filter(t => {
            if (t.id.startsWith('mine-player-')) {
                const targets = [...g.enemies, ...g.bosses].filter(tgt => tgt && tgt.status === 'active');
                
                // TRUE FORM: Magnetic Mines
                if (isTrueForm) {
                    let closestTarget: any = null;
                    let closestDist = 9999;
                    
                    for (const target of targets) {
                         if (!target) continue;
                         const dist = Math.hypot(target.position.x - t.position.x, target.position.y - t.position.y);
                         if (dist < 400 && dist < closestDist) { // 400 range magnet
                             closestDist = dist;
                             closestTarget = target;
                         }
                    }
                    
                    if (closestTarget) {
                        const angle = Math.atan2(closestTarget.position.y - t.position.y, closestTarget.position.x - t.position.x);
                        const speed = 2.0 * timeScale;
                        t.position.x += Math.cos(angle) * speed;
                        t.position.y += Math.sin(angle) * speed;
                    }
                }

                let detonated = false;
                for (const target of targets) {
                    if (!target) continue;
                    const dist = Math.hypot(target.position.x - t.position.x, target.position.y - t.position.y);
                    if (dist < 60) {
                        detonated = true;
                        audio.play('rocketExplosion', t.position.x);
                        g.animations.push({ id: `mine-exp-${now}-${t.id}`, type: 'explosion', position: t.position, createdAt: now, duration: 600, color: '#f97316' });
                        g.screenShake += 5;

                        targets.forEach(aoeTarget => {
                             if (!aoeTarget) return;
                             const aoeDist = Math.hypot(aoeTarget.position.x - t.position.x, aoeTarget.position.y - t.position.y);
                             if (aoeDist < 100) {
                                 const dmg = 8;
                                 aoeTarget.health -= dmg;
                                 aoeTarget.lastHitTime = now;
                                 g.damageNumbers.push({id: `mine-dmg-${now}-${aoeTarget.id}`, text: dmg.toString(), position: aoeTarget.position, createdAt: now, duration: 800, color: '#f97316'});
                                 
                                 if (aoeTarget.health <= 0) {
                                     aoeTarget.status = 'dead';
                                     if ('type' in aoeTarget && aoeTarget.type === 'enemy') handleEnemyDeath(aoeTarget);
                                     else if ('bossType' in aoeTarget) {
                                          g.animations.push({ id: `b-die-${now}`, type: 'explosion', position: aoeTarget.position, createdAt: now, duration: 1000, color: 'red' });
                                          audio.play('bossExplosion');
                                          audio.stopEngine(aoeTarget.id);
                                          setTimeout(() => { 
                                              game.current.bosses = game.current.bosses.filter(b => b.id !== aoeTarget.id); 
                                          }, 1000);
                                     }
                                 }
                             }
                        });
                        break;
                    }
                }
                if (detonated) return false;
            }
            return true;
        });
        
        // --- PROCESS EFFECT ZONES (Fissure & Fire Damage) ---
        g.effectZones.forEach(zone => {
             if (zone.type === 'fissure' || zone.type === 'fire') {
                 if (!zone.lastTick || now - zone.lastTick > 500) { // Tick every 500ms
                     zone.lastTick = now;
                     // Damage enemies in zone
                     const targets = [...g.enemies, ...g.bosses].filter(tgt => tgt && tgt.status === 'active');
                     targets.forEach(tgt => {
                         if (!tgt) return;
                         const d = Math.hypot(tgt.position.x - zone.position.x, tgt.position.y - zone.position.y);
                         if (d < zone.radius) {
                             const dmg = zone.type === 'fire' ? 8 : 5;
                             tgt.health -= dmg;
                             tgt.lastHitTime = now;
                             g.damageNumbers.push({id: `${zone.type}-dmg-${now}-${tgt.id}`, text: dmg.toString(), position: {...tgt.position, y: tgt.position.y - 20}, createdAt: now, duration: 800, color: zone.type === 'fire' ? '#ef4444' : '#f97316'});
                             if (tgt.health <= 0) {
                                 tgt.status = 'dead';
                                 if ('type' in tgt && tgt.type === 'enemy') handleEnemyDeath(tgt);
                                 else if ('bossType' in tgt) {
                                      g.animations.push({ id: `b-die-${now}`, type: 'explosion', position: tgt.position, createdAt: now, duration: 1000, color: 'red' });
                                      audio.play('bossExplosion');
                                      audio.stopEngine(tgt.id);
                                      setTimeout(() => { 
                                          game.current.bosses = game.current.bosses.filter(b => b.id !== tgt.id); 
                                      }, 1000);
                                 }
                             }
                         }
                     });
                 }
             }
        });
        // Cleanup expired zones
        g.effectZones = g.effectZones.filter(z => now < z.createdAt + z.duration);

        // 1. Player Movement
        let playerSpeed = 0;
        if (player.status === 'active') {
            let dx = 0, dy = 0;
            if (g.keys['w'] || g.keys['arrowup']) dy -= 1;
            if (g.keys['s'] || g.keys['arrowdown']) dy += 1;
            if (g.keys['a'] || g.keys['arrowleft']) dx -= 1;
            if (g.keys['d'] || g.keys['arrowright']) dx += 1;

            if (dx !== 0 || dy !== 0) {
                const len = Math.hypot(dx, dy);
                dx /= len; dy /= len;
                
                let baseSpeed = PLAYER_SPEED;
                if (config.sandboxConfig) {
                    if (config.sandboxConfig.characterId === 'rogue-scout') baseSpeed = 5.0;
                    else if (config.sandboxConfig.characterId === 'iron-bastion') baseSpeed = 2.0;
                    else if (config.sandboxConfig.characterId === 'goliath-prime') baseSpeed = 1.5;
                }
                
                // Boost speed if Overdrive chassis
                if (player.chassis === 'goliath-prime-overdrive') baseSpeed = 2.5;

                const speed = baseSpeed * (g.abilities.find(a=>a.id==='overdrive')?.state === 'active' ? 1.5 : 1) * timeScale;
                player.position.x += dx * speed;
                player.position.y += dy * speed;
                player.velocity = { x: dx * speed, y: dy * speed };
                playerSpeed = speed;
                
                if (player.bossType === 'goliath') {
                     const targetAngle = Math.atan2(dy, dx) * (180/Math.PI);
                     let angleDiff = targetAngle - player.angle;
                     while (angleDiff <= -180) angleDiff += 360;
                     while (angleDiff > 180) angleDiff -= 360;
                     player.angle += angleDiff * 0.05 * timeScale;
                } else {
                     player.angle = Math.atan2(dy, dx) * (180/Math.PI);
                }
                
                player.position.x = Math.max(20, Math.min(ARENA_WIDTH-20, player.position.x));
                player.position.y = Math.max(20, Math.min(ARENA_HEIGHT-20, player.position.y));
            } else {
                player.velocity = {x: 0, y: 0};
            }
            
            const sweepActive = g.abilities.find(a => a.id === 'laserSweep' && a.state === 'active');
            if (!sweepActive) {
                player.turretAngle = Math.atan2(g.mouse.y - player.position.y, g.mouse.x - player.position.x) * (180/Math.PI);
            }
        }

        if (player.status === 'active') {
             audio.updateEngine('player', player.bossType === 'goliath' ? 'boss' : 'player', playerSpeed);
        }

        // 2. Abilities & Projectiles & Boss & AI
        updateAbilities(now, timeScale);
        updateHomingProjectiles(dt, g.enemies, g.boss);
        
        g.projectiles.forEach(p => {
            p.position.x += p.velocity.x * timeScale;
            p.position.y += p.velocity.y * timeScale;
        });
        g.projectiles = g.projectiles.filter(p => {
             if (p.id.startsWith('flame-') && now - p.createdAt > 400) return false;
             return p.position.x > 0 && p.position.x < ARENA_WIDTH && p.position.y > 0 && p.position.y < ARENA_HEIGHT;
        });

        if (g.boss) {
            updateBoss(g.boss, player, now, timeScale);
            const bossSpeed = Math.hypot(g.boss.velocity.x, g.boss.velocity.y);
            audio.updateEngine('boss', 'boss', bossSpeed * 10);
        }
        
        // Spawn Enemies
        if (config.mode === 'campaign' || config.mode === 'sandbox') {
            const maxEnemies = config.mode === 'sandbox' ? 8 : diffConfig.maxEnemiesBase + g.wave;
            if (!g.boss && g.enemies.length < maxEnemies && now - g.lastEnemySpawnTime > diffConfig.spawnInterval) {
                spawnEnemy();
                g.lastEnemySpawnTime = now;
            }
            if (config.mode === 'campaign' && !g.boss && player.score >= 500 && g.wave === 1) {
                spawnBoss('goliath');
                g.wave++;
            }
        }

        // AI Update
        g.enemies.forEach(e => updateEnemyAI(e, player, game.current.powerUps, now, timeScale, diffConfig, () => {
            const angle = e.turretAngle;
            if (e.activePowerUps?.includes('homingMissiles') && (e.homingMissileCount || 0) > 0) {
                 fireMissile(e.id, false); 
                 e.homingMissileCount = (e.homingMissileCount || 0) - 1;
                 if (e.homingMissileCount <= 0) e.activePowerUps = e.activePowerUps.filter(p => p !== 'homingMissiles');
            } else if (e.activePowerUps?.includes('dualCannon')) {
                 // Intermediate: fwd 28, lat 6. Basic: fwd 22, lat 4
                 const fwd = e.tier === 'intermediate' ? 28 : 22;
                 const lat = e.tier === 'intermediate' ? 6 : 4;
                 fireProjectileAt(getOffsetPoint(e.position, angle, fwd, lat), angle, e.id);
                 fireProjectileAt(getOffsetPoint(e.position, angle, fwd, -lat), angle, e.id);
            } else {
                 const fwd = e.tier === 'intermediate' ? 28 : 22;
                 fireProjectileAt(getOffsetPoint(e.position, angle, fwd, 0), angle, e.id);
            }
        }));
        
        // Manage Enemy Engine Sounds
        const enemiesWithDist = g.enemies.map(e => ({
            e, dist: Math.hypot(player.position.x - e.position.x, player.position.y - e.position.y)
        }));
        enemiesWithDist.sort((a, b) => a.dist - b.dist);
        
        enemiesWithDist.slice(0, 3).forEach(({e}) => {
             const speed = Math.hypot(e.velocity.x, e.velocity.y);
             audio.updateEngine(e.id, 'enemy', speed);
        });
        enemiesWithDist.slice(3).forEach(({e}) => {
             audio.stopEngine(e.id);
        });

        checkCollisions(now);
        
        // Cleanup
        g.damageNumbers = g.damageNumbers.filter(d => now < d.createdAt + d.duration);
        g.telegraphs = g.telegraphs.filter(t => now < t.createdAt + t.duration);
        g.animations = g.animations.filter(a => now < a.createdAt + a.duration);
        g.combatText = g.combatText.filter(ct => now < ct.createdAt + ct.duration);
        g.killFeed = g.killFeed.filter(kf => now < kf.createdAt + 5000); // Kill feed messages last 5 seconds
        
        if (g.projectiles.length > 200) g.projectiles = g.projectiles.slice(-200);
        if (g.animations.length > 100) g.animations = g.animations.slice(-100);
        if (g.damageNumbers.length > 50) g.damageNumbers = g.damageNumbers.slice(-50);

        const currentEnemyCount = g.enemies.length + (g.boss ? 1 : 0);
        if (currentEnemyCount !== g.lastSyncedEnemiesRemaining) {
             g.lastSyncedEnemiesRemaining = currentEnemyCount;
             setUiState(prev => ({...prev, enemiesRemaining: currentEnemyCount}));
        }

        if (g.player.score !== g.lastSyncedScore) {
             g.lastSyncedScore = g.player.score;
             setUiState(prev => ({...prev, playerScore: g.player.score}));
        }

        if (g.player.health !== g.lastSyncedPlayerHealth) {
             g.lastSyncedPlayerHealth = g.player.health;
             setUiState(prev => ({...prev, playerHealth: g.player.health}));
        }

        if ((g.player.shieldHealth || 0) !== g.lastSyncedPlayerShield) {
             g.lastSyncedPlayerShield = g.player.shieldHealth || 0;
             setUiState(prev => ({...prev, playerShield: g.player.shieldHealth || 0}));
        }

        if ((g.player.damageConverterCharge || 0) !== g.lastSyncedCharge) {
             g.lastSyncedCharge = g.player.damageConverterCharge || 0;
             setUiState(prev => ({...prev, damageConverterCharge: g.player.damageConverterCharge || 0}));
        }
    };
    
    const updateAbilities = (now: number, timeScale: number) => {
        const g = game.current;
        let stateChanged = false;
        
        const overdriveActive = g.abilities.find(a => a.id === 'overdrive')?.state === 'active';
        const isTrueForm = g.player.chassis === 'goliath-prime-overdrive';

        g.abilities = g.abilities.map(a => {
            let newState = a.state;
            let newStartTime = a.startTime;
            
            // Sandbox: Infinite Energy
            if (g.sandbox.infiniteEnergy && newState === 'cooldown') {
                newState = 'ready';
                stateChanged = true;
            }

            // BOSS ABILITIES (SANDBOX)
            if (a.id === 'laserSweep' && a.state === 'active') {
                 g.player.turretAngle += 0.706 * timeScale;
                 
                 // UNIQUE INTERACTION: True Form X-Pattern Laser
                 const isTrueForm = g.player.chassis === 'goliath-prime-overdrive';
                 const laserCount = isTrueForm ? 4 : 1;
                 const damage = isTrueForm ? 10 : 5;
                 
                 if (now - g.lastBossBeamTick > 100) { 
                    g.lastBossBeamTick = now;
                    // Beam originates from tip: Goliath 65, Standard 30
                    const tipOffset = g.player.bossType === 'goliath' ? 65 : 30;
                    
                    for(let i=0; i < laserCount; i++) {
                        const beamAngle = g.player.turretAngle + (isTrueForm ? i * 90 : 0);
                        const firePos = getOffsetPoint(g.player.position, beamAngle, tipOffset, 0);
                        
                        const rad = beamAngle * (Math.PI/180); 
                        const beamLen = 900;
                        const p1 = firePos; 
                        const p2 = { x: p1.x + Math.cos(rad) * beamLen, y: p1.y + Math.sin(rad) * beamLen };
                        
                        g.enemies.forEach(e => {
                            const l2 = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
                            let t = ((e.position.x - p1.x) * (p2.x - p1.x) + (e.position.y - p1.y) * (p2.y - p1.y)) / l2;
                            t = Math.max(0, Math.min(1, t));
                            const proj = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
                            const dist = Math.hypot(e.position.x - proj.x, e.position.y - proj.y);
                            
                            if (dist < 30) {
                                e.health -= damage;
                                e.lastHitTime = now;
                                g.damageNumbers.push({id: `sweep-${now}-${e.id}-${i}`, text: damage.toString(), position: e.position, createdAt: now, duration: 500, color: isTrueForm ? '#fbbf24' : '#f00'});
                                if (e.health <= 0) handleEnemyDeath(e);
                            }
                        });
                    }
                }
                
                if (now > a.startTime + (a.duration || 8500)) {
                     audio.stop('bossLaserLoop');
                     newState = 'cooldown';
                     newStartTime = now;
                     stateChanged = true;
                }
            }
            else if (a.id === 'nanoSwarm' && a.state === 'active') {
                if (now > a.startTime + (a.duration || 500)) {
                    newState = 'cooldown';
                    newStartTime = now;
                    stateChanged = true;
                }
            }
            else if (a.id === 'scatterMines' && a.state === 'active') {
                if (now > a.startTime + (a.duration || 500)) {
                    newState = 'cooldown';
                    newStartTime = now;
                    stateChanged = true;
                }
            }
            else if (a.id === 'omniBarrage' && a.state === 'active') {
                if (now > a.startTime + (a.duration || 500)) {
                    newState = 'cooldown';
                    newStartTime = now;
                    stateChanged = true;
                }
            }
            // NEW ABILITIES
            else if (a.id === 'phaseShift') {
                if (a.state === 'active') {
                    g.player.isInvulnerable = true;
                    // Visual effect: Ghostly
                    if (now % 100 < 20) {
                         g.animations.push({ id: `ghost-${now}`, type: 'dashTrail', position: {...g.player.position}, angle: g.player.angle, createdAt: now, duration: 300, color: '#a855f7', opacity: 0.5 });
                    }

                    // Phase Damage: Damage enemies we pass through
                    if (now - (a.firedCount || 0) > 200) { // Tick every 200ms
                        const phaseDamage = 15;
                        const phaseRadius = 50;
                        
                        [...g.enemies, g.boss].forEach(target => {
                            if (!target || target.status !== 'active') return;
                            const dist = Math.hypot(target.position.x - g.player.position.x, target.position.y - g.player.position.y);
                            if (dist < phaseRadius) {
                                applyDamage(target, phaseDamage, 'player');
                                g.damageNumbers.push({ id: `phase-dmg-${now}-${target.id}`, text: phaseDamage.toString(), position: {...target.position, y: target.position.y - 40}, createdAt: now, duration: 600, color: '#a855f7' });
                                audio.play('impact_damage', target.position.x);
                                
                                // Visual feedback for hit
                                g.animations.push({ id: `phase-hit-${now}-${target.id}`, type: 'hit', position: target.position, createdAt: now, duration: 200, color: '#a855f7' });
                            }
                        });
                        a.firedCount = now;
                    }
                    
                    if (now > a.startTime + (a.duration || 3000)) {
                        g.player.isInvulnerable = false;
                        newState = 'cooldown';
                        newStartTime = now;
                        stateChanged = true;
                    }
                }
            }
            else if (a.id === 'flamethrower' && a.state === 'active') {
                const fireRate = 50; // ms
                if (now - (a.firedCount || 0) > fireRate) {
                    a.firedCount = now;
                    // Fire 3 spread shots
                    for(let i=-1; i<=1; i++) {
                        const angle = g.player.turretAngle + (Math.random() * 15 - 7.5) + (i * 8);
                        const offset = getOffsetPoint(g.player.position, angle, 40, 0);
                        const rad = angle * (Math.PI/180);
                        const speed = 12;
                        
                        g.projectiles.push({
                            id: `flame-${now}-${i}-${Math.random()}`,
                            ownerId: 'player',
                            position: offset,
                            angle: angle,
                            velocity: { x: Math.cos(rad) * speed, y: Math.sin(rad) * speed },
                            createdAt: now,
                            size: { width: 12, height: 12 },
                            damage: 3,
                            color: '#ef4444'
                        });
                    }
                    if (Math.random() > 0.5) audio.play('rocketLaunch'); 
                }
                
                if (now > a.startTime + (a.duration || 3000)) {
                    newState = 'cooldown';
                    newStartTime = now;
                    stateChanged = true;
                }
            }
            else if (a.id === 'chainLightning' && a.state === 'active') {
                 // Instant fire
                 const range = 500;
                 const damage = 15;
                 const targets = g.enemies.filter(e => e.status === 'active' && Math.hypot(e.position.x - g.player.position.x, e.position.y - g.player.position.y) < range);
                 
                 if (targets.length > 0) {
                     // Sort by distance
                     targets.sort((a,b) => Math.hypot(a.position.x - g.player.position.x, a.position.y - g.player.position.y) - Math.hypot(b.position.x - g.player.position.x, b.position.y - g.player.position.y));
                     
                     const first = targets[0];
                     first.health -= damage;
                     first.lastHitTime = now;
                     g.damageNumbers.push({id: `chain-1-${now}`, text: damage.toString(), position: first.position, createdAt: now, duration: 800, color: '#eab308'});
                     g.animations.push({ id: `chain-1-${now}`, type: 'lightning', position: g.player.position, targetPosition: first.position, createdAt: now, duration: 400, color: '#eab308' });
                     audio.play('teslaZap');

                     // Chain to second
                     const second = targets[1]; 
                     if (second) {
                         second.health -= damage * 0.7;
                         second.lastHitTime = now;
                         g.damageNumbers.push({id: `chain-2-${now}`, text: Math.round(damage*0.7).toString(), position: second.position, createdAt: now, duration: 800, color: '#eab308'});
                         g.animations.push({ id: `chain-2-${now}`, type: 'lightning', position: first.position, targetPosition: second.position, createdAt: now, duration: 400, color: '#eab308' });
                     }
                 }
                 
                 newState = 'cooldown';
                 newStartTime = now;
                 stateChanged = true;
            }
            else if (a.id === 'prismGuard' && a.state === 'active') {
                // Instant shield boost
                if (now - a.startTime < 50) { // Only on first frame roughly
                    g.player.shieldHealth = (g.player.shieldHealth || 0) + 50;
                    if (!g.player.activePowerUps) g.player.activePowerUps = [];
                    if (!g.player.activePowerUps.includes('shield')) g.player.activePowerUps.push('shield'); // Visual
                    g.player.powerUpExpireTime = now + (a.duration || 5000);
                    audio.play('abilityReady');
                }
                
                if (now > a.startTime + (a.duration || 5000)) {
                    newState = 'cooldown';
                    newStartTime = now;
                    stateChanged = true;
                }
            }
            else if (a.id === 'omniBarrage') {
                // Reworked Omni Barrage: Hold 'E' to channel
                const isKeyDown = game.current.keys[a.keyBinding];
                
                if (a.state === 'ready' && isKeyDown) {
                    newState = 'active';
                    newStartTime = now;
                    stateChanged = true;
                    audio.start('omniCharge');
                } else if (a.state === 'active') {
                    if (!isKeyDown || now > a.startTime + (a.duration || 10000)) {
                        newState = 'cooldown';
                        newStartTime = now;
                        stateChanged = true;
                        audio.stop('omniCharge');
                    } else {
                        // Channeling Logic
                        const fireRate = 100; // Fast fire
                        if (now - (a.firedCount || 0) > fireRate) {
                            a.firedCount = now;
                            
                            // Fire towards cursor
                            const mouse = game.current.mouse;
                            const angle = Math.atan2(mouse.y - g.player.position.y, mouse.x - g.player.position.x) * (180/Math.PI);
                            const spread = (Math.random() - 0.5) * 30; // 30 degree spread
                            const finalAngle = angle + spread;
                            const rad = finalAngle * (Math.PI/180);
                            const speed = 10;
                            
                            // Check for nearby enemies to auto-target
                            let targetId: string | undefined;
                            const range = 400;
                            const nearby = g.enemies.filter(e => e.status === 'active' && Math.hypot(e.position.x - g.player.position.x, e.position.y - g.player.position.y) < range);
                            if (g.boss && g.boss.status === 'active' && Math.hypot(g.boss.position.x - g.player.position.x, g.boss.position.y - g.player.position.y) < range) {
                                nearby.push(g.boss as any);
                            }
                            
                            if (nearby.length > 0) {
                                // Pick random nearby or closest? Random for barrage feel
                                const target = nearby[Math.floor(Math.random() * nearby.length)];
                                targetId = target.id;
                            }

                            g.projectiles.push({
                                id: `omni-${now}-${Math.random()}`,
                                ownerId: 'player',
                                position: getOffsetPoint(g.player.position, finalAngle, 40, 0),
                                angle: finalAngle,
                                velocity: { x: Math.cos(rad) * speed, y: Math.sin(rad) * speed },
                                createdAt: now,
                                size: { width: 14, height: 6 },
                                damage: 2,
                                color: '#ef4444',
                                isHoming: !!targetId,
                                targetId: targetId,
                                turnRate: 8
                            });
                            audio.play('rocketLaunch');
                        }
                    }
                }
            }
            // STANDARD ABILITIES
            if (a.id === 'overdrive' && a.state === 'ready' && g.keys[a.keyBinding]) {
                newState = 'active';
                newStartTime = now;
                stateChanged = true;
                audio.start('overdriveLoop');
                g.combatText.push({ id: `ct-${now}`, text: 'OVERDRIVE', createdAt: now, duration: 2000, color: '#f59e0b', isCritical: true });
            }
            else if (a.id === 'missileBarrage' && a.state === 'ready' && g.keys[a.keyBinding]) {
                newState = 'active';
                newStartTime = now;
                stateChanged = true;
                a.firedCount = 0;
                g.combatText.push({ id: `ct-${now}`, text: 'MISSILE BARRAGE', createdAt: now, duration: 2000, color: '#ef4444', isCritical: true });
            }
            else if (a.id === 'missileBarrage' && a.state === 'active') {
                const totalMissiles = isTrueForm ? 60 : (overdriveActive ? 40 : 20);
                const interval = (a.duration || 1000) / totalMissiles;
                const elapsed = now - a.startTime;
                
                const shouldHaveFired = Math.min(totalMissiles, Math.floor(elapsed / interval));
                const firedSoFar = a.firedCount || 0;
                
                // INTERACTION: Prism Guard + Missile Barrage = Crystalline Missiles
                // INTERACTION: Phase Shift + Missile Barrage = Ghost Missiles
                // Missiles split on impact (handled in collision logic, but we need to flag them)
                const prismActive = g.abilities.find(ab => ab.id === 'prismGuard')?.state === 'active';
                const phaseActive = g.abilities.find(ab => ab.id === 'phaseShift')?.state === 'active';
                
                if (shouldHaveFired > firedSoFar) {
                    const count = shouldHaveFired - firedSoFar;
                    for(let i=0; i<count; i++) {
                         fireMissile('player', overdriveActive || isTrueForm, phaseActive ? 1.5 : 1, prismActive);
                    }
                    a.firedCount = shouldHaveFired;
                }

                if (elapsed > (a.duration || 1000)) {
                    newState = 'cooldown';
                    newStartTime = now;
                    stateChanged = true;
                    a.firedCount = 0;
                }
            }
            else if (a.id === 'teslaStorm' && a.state === 'active') {
                const zapInterval = isTrueForm ? 150 : (overdriveActive ? 250 : 500);
                const zapRange = isTrueForm ? 500 : 350;
                let damage = isTrueForm ? 8 : 5;
                const maxTargets = isTrueForm ? 6 : 3;
                
                // INTERACTION: Phase Shift + Tesla Storm = Void Lightning
                const phaseActive = g.abilities.find(ab => ab.id === 'phaseShift')?.state === 'active';
                const isVoidLightning = phaseActive;
                if (isVoidLightning) {
                    damage *= 1.5; // True damage (simulated by high value or ignore shield)
                    // Actually we can just pass a flag to applyDamage or handle it here.
                    // For now, just increased damage and purple color.
                }

                if (now - (a.firedCount || 0) > zapInterval) {
                    const targets = g.enemies.filter(e => e.status === 'active' && Math.hypot(e.position.x - g.player.position.x, e.position.y - g.player.position.y) < zapRange);
                    if (g.boss && g.boss.status === 'active' && Math.hypot(g.boss.position.x - g.player.position.x, g.boss.position.y - g.player.position.y) < zapRange) {
                        targets.push(g.boss as any);
                    }
                    const zaps = targets.slice(0, maxTargets);
                    
                    if (zaps.length > 0) {
                        a.firedCount = now;
                        audio.play('teslaZap');
                        
                        // INTERACTION: Prism Guard + Tesla Storm = Static Discharge
                        const prismActive = g.abilities.find(ab => ab.id === 'prismGuard')?.state === 'active';
                        if (prismActive) {
                            g.animations.push({
                                id: `static-${now}`,
                                type: 'shockwave',
                                position: g.player.position,
                                createdAt: now,
                                duration: 400,
                                color: '#06b6d4'
                            });
                            g.enemies.forEach(e => {
                                const d = Math.hypot(e.position.x - g.player.position.x, e.position.y - g.player.position.y);
                                if (d < 150) {
                                    const angle = Math.atan2(e.position.y - g.player.position.y, e.position.x - g.player.position.x);
                                    e.position.x += Math.cos(angle) * 20;
                                    e.position.y += Math.sin(angle) * 20;
                                }
                            });
                        }

                        zaps.forEach(target => {
                            // Void Lightning ignores shields?
                            if (isVoidLightning && target.shieldHealth && target.shieldHealth > 0) {
                                // Bypass shield logic by damaging health directly
                                target.health -= damage;
                                target.lastHitTime = now;
                                g.damageNumbers.push({
                                    id: `dmg-void-${now}-${Math.random()}`, text: Math.round(damage).toString(), position: { x: target.position.x, y: target.position.y - 40 }, createdAt: now, duration: 600, color: '#a855f7', isCritical: true
                                });
                            } else {
                                target.health -= damage;
                                target.lastHitTime = now;
                                g.damageNumbers.push({
                                    id: `dmg-tesla-${now}-${Math.random()}`, text: Math.round(damage).toString(), position: { x: target.position.x, y: target.position.y - 40 }, createdAt: now, duration: 600, color: isVoidLightning ? '#a855f7' : '#00F0FF'
                                });
                            }

                            g.animations.push({
                                id: `lightning-${now}-${Math.random()}`, type: 'lightning', position: g.player.position, targetPosition: target.position, createdAt: now, duration: 300, color: isVoidLightning ? '#a855f7' : '#00F0FF'
                            });
                            
                            if (target.health <= 0) {
                                if ('type' in target && target.type === 'enemy') handleEnemyDeath(target as TankType);
                                else if ('bossType' in target) {
                                     g.animations.push({ id: `b-die-${now}`, type: 'explosion', position: target.position, createdAt: now, duration: 1000, color: 'red' });
                                     audio.play('bossExplosion');
                                     audio.stopEngine('boss');
                                     setTimeout(() => { game.current.boss = null; }, 1000);
                                }
                            }
                        });
                    }
                }
                if (now > a.startTime + (a.duration || 6000)) {
                    newState = 'cooldown';
                    newStartTime = now;
                    stateChanged = true;
                }
            }
            else if (a.id === 'cyberBeam' && a.state === 'charging') {
                if (now > a.startTime + (a.chargeDuration || 1500)) {
                    newState = 'active';
                    newStartTime = now;
                    stateChanged = true;
                    audio.stop('beamCharge');
                    audio.start('beamFire');
                }
            }
            else if (a.id === 'cyberBeam' && a.state === 'active') {
                if (now > a.startTime + (a.duration || 6000)) {
                    newState = 'cooldown';
                    newStartTime = now;
                    stateChanged = true;
                    audio.stop('beamFire');
                } else {
                    checkBeamCollision(now);
                }
            }
            else if (a.state === 'active' && now > a.startTime + (a.duration || 0)) {
                if (a.id === 'overdrive') audio.stop('overdriveLoop');
                newState = 'cooldown';
                newStartTime = now;
                stateChanged = true;
            }
            else if (a.state === 'cooldown' && now > a.startTime + (a.cooldown || 0)) {
                newState = 'ready';
                stateChanged = true;
                audio.play('abilityReady');
            }
            return { ...a, state: newState, startTime: newStartTime };
        });

        if (stateChanged) {
             setUiState(prev => ({...prev, abilities: [...g.abilities]}));
        }
    };

    const updateHomingProjectiles = (dt: number, enemies: TankType[], boss: Boss | null) => {
        const timeScale = dt / 16.67;
        game.current.projectiles.forEach(p => {
            if (p.isHoming) {
                let targetPos: Vector | null = null;
                if (p.ownerId === 'player') {
                    if (boss && boss.status === 'active') {
                        targetPos = boss.position;
                    } else {
                        let minDist = 9999;
                        enemies.forEach(e => {
                            if (e.status !== 'active') return;
                            const d = Math.hypot(e.position.x - p.position.x, e.position.y - p.position.y);
                            if (d < minDist) { minDist = d; targetPos = e.position; }
                        });
                    }
                } else {
                    if (game.current.player.status === 'active' && !game.current.player.isInvulnerable) {
                        targetPos = game.current.player.position;
                    }
                }

                if (targetPos) {
                    const desiredAngle = Math.atan2(targetPos.y - p.position.y, targetPos.x - p.position.x) * (180/Math.PI);
                    let angleDiff = desiredAngle - p.angle;
                    while (angleDiff <= -180) angleDiff += 360;
                    while (angleDiff > 180) angleDiff -= 360;
                    const turnRate = (p.turnRate || 5) * timeScale;
                    if (Math.abs(angleDiff) < turnRate) p.angle = desiredAngle;
                    else p.angle += Math.sign(angleDiff) * turnRate;

                    const speed = Math.hypot(p.velocity.x, p.velocity.y);
                    const rad = p.angle * (Math.PI/180);
                    p.velocity.x = Math.cos(rad) * speed;
                    p.velocity.y = Math.sin(rad) * speed;
                }
            }
        });
    }

    const checkBeamCollision = (now: number) => {
        const g = game.current;
        if (now - g.lastBeamTick < 150) return;
        g.lastBeamTick = now;

        const player = g.player;
        const mouse = g.mouse;
        
        let beamStart = { x: player.position.x, y: player.position.y };
        if (player.bossType === 'goliath' || player.chassis === 'goliath-prime-overdrive') {
             beamStart = getOffsetPoint(player.position, player.turretAngle, 65, 0);
        } else {
             beamStart = getOffsetPoint(player.position, player.turretAngle, 30, 0);
        }

        const dx = mouse.x - beamStart.x;
        const dy = mouse.y - beamStart.y;
        
        const overdriveActive = g.abilities.find(a => a.id === 'overdrive')?.state === 'active';
        
        let damageMultiplier = overdriveActive ? 2.5 : 1.0;
        if (player.chassis === 'goliath-prime-overdrive') damageMultiplier *= 1.5;

        // INTERACTION: Overdrive + Cyber Beam = Hyper Beam
        // Wider beam, more damage, different color
        const isHyperBeam = overdriveActive;
        if (isHyperBeam) {
            damageMultiplier *= 1.5; // Total 3.75x base
        }

        const beamLen = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const endX = mouse.x;
        const endY = mouse.y;

        const checkHit = (target: TankType | Boss) => {
            if (!target || target.status !== 'active') return false;
            const px = target.position.x;
            const py = target.position.y;
            const radius = target.size.width / 2;

            const l2 = beamLen * beamLen;
            if (l2 === 0) return false;
            
            const t = ((px - beamStart.x) * (endX - beamStart.x) + (py - beamStart.y) * (endY - beamStart.y)) / ((endX - beamStart.x)**2 + (endY - beamStart.y)**2);
            const tClamped = Math.max(0, Math.min(1, t));
            
            const projX = beamStart.x + tClamped * (endX - beamStart.x);
            const projY = beamStart.y + tClamped * (endY - beamStart.y);
            const dist = Math.hypot(px - projX, py - projY);
            
            // Hyper Beam is wider
            const beamWidth = isHyperBeam ? 30 : 15;
            return dist < radius + beamWidth;
        };

        let hit = false;
        
        // INTERACTION: Tesla Storm + Cyber Beam = Arc Beam
        const teslaActive = g.abilities.find(a => a.id === 'teslaStorm')?.state === 'active';

        g.enemies.forEach(e => {
            if (checkHit(e)) {
                const dmg = 1.5 * damageMultiplier;
                applyDamage(e, dmg, 'player');
                hit = true;
                
                if (isHyperBeam && Math.random() < 0.3) {
                     g.animations.push({ id: `hyper-hit-${now}-${Math.random()}`, type: 'hit', position: e.position, createdAt: now, duration: 200, color: '#00F0FF' });
                }

                if (teslaActive && Math.random() < 0.3) {
                     // Chain lightning from hit enemy
                     const otherEnemies = g.enemies.filter(oe => oe.id !== e.id && oe.status === 'active');
                     otherEnemies.forEach(oe => {
                         const d = Math.hypot(oe.position.x - e.position.x, oe.position.y - e.position.y);
                         if (d < 150) {
                             applyDamage(oe, 2, 'player');
                             g.animations.push({
                                 id: `arc-${now}-${oe.id}`,
                                 type: 'lightning',
                                 position: e.position,
                                 targetPosition: oe.position,
                                 createdAt: now,
                                 duration: 200,
                                 color: '#00F0FF'
                             });
                         }
                     });
                }
            }
        });

        if (g.boss && checkHit(g.boss)) {
             const dmg = 1.5 * damageMultiplier;
             applyDamage(g.boss, dmg, 'player');
             hit = true;

             if (teslaActive && Math.random() < 0.3) {
                  g.enemies.forEach(oe => {
                      if (oe.status !== 'active') return;
                      const d = Math.hypot(oe.position.x - g.boss!.position.x, oe.position.y - g.boss!.position.y);
                      if (d < 150) {
                          applyDamage(oe, 2, 'player');
                          g.animations.push({
                              id: `arc-boss-${now}-${oe.id}`,
                              type: 'lightning',
                              position: g.boss!.position,
                              targetPosition: oe.position,
                              createdAt: now,
                              duration: 200,
                              color: '#00F0FF'
                          });
                      }
                  });
             }
        }
        
        if (hit) g.screenShake = Math.max(g.screenShake, isHyperBeam ? 4 : 2);
    };

    const updateBoss = (boss: Boss, player: TankType, now: number, timeScale: number) => {
        if (boss.status !== 'active') return;

        if (Math.random() < 0.005 * timeScale * diffConfig.bossAggression) {
            // Nova Burst still centered is fine (omni-directional), but let's fire from multiple tips if possible?
            // Actually Nova is typically center-body burst.
            const count = 12;
            for(let i=0; i<count; i++) {
                const angle = (360 / count) * i + (now * 0.1); 
                fireProjectileAt(boss.position, angle, boss.id);
            }
            audio.play('shot_5', boss.position.x);
        }

        if (Math.random() < 0.003 * timeScale * diffConfig.bossAggression) {
            fireMissile('boss', false);
        }

        if (boss.health < boss.maxHealth * 0.20 && !boss.hasUsedLastStand) { 
            boss.hasUsedLastStand = true;
            boss.attackState = { currentAttack: 'lastStand', phase: 'charging', phaseStartTime: now, attackData: { attackDuration: 3000 } };
            audio.start('bossCritical');
        }

        if (boss.attackState.currentAttack === 'lastStand') {
            const { phaseStartTime, attackData } = boss.attackState;
            const elapsed = now - phaseStartTime;
            boss.velocity = {x: 0, y: 0};
            if (elapsed >= (attackData?.attackDuration || 3000)) {
                audio.stop('bossCritical');
                audio.play('bossExplosion');
                game.current.animations.push({ id: `final-blast-${now}`, type: 'finalBlast', position: boss.position, createdAt: now, duration: 2500, color: '#fff' });
                game.current.screenShake = 50;
                const maxRadius = 300;
                const distToPlayer = Math.hypot(player.position.x - boss.position.x, player.position.y - boss.position.y);
                if (distToPlayer < maxRadius) {
                    player.health = 0;
                    player.lastHitTime = now;
                    setUiState(prev => ({...prev, playerHealth: 0}));
                }
                boss.health = Math.max(10, boss.health - (boss.maxHealth * 0.1)); 
                boss.attackState = { currentAttack: 'none', phase: 'recovering', phaseStartTime: now, attackData: { recoveryDuration: 2000 } };
                audio.play('bossRecover');
                game.current.projectiles = game.current.projectiles.filter(p => Math.hypot(p.position.x - boss.position.x, p.position.y - boss.position.y) > maxRadius);
                return;
            }
            return;
        }

        // --- GOLIATH PRIME: BARRELS ---
        if (boss.attackState.currentAttack === 'laserSweep' && boss.attackState.phase === 'attacking') {
            // Spawn barrels periodically
            if (now % 1000 < 20) {
                 const angle = Math.random() * Math.PI * 2;
                 const dist = 100 + Math.random() * 300;
                 const pos = { x: boss.position.x + Math.cos(angle) * dist, y: boss.position.y + Math.sin(angle) * dist };
                 
                 // Check if valid pos
                 if (pos.x > 50 && pos.x < ARENA_WIDTH - 50 && pos.y > 50 && pos.y < ARENA_HEIGHT - 50) {
                     game.current.barrels.push({
                         id: `barrel-${now}-${Math.random()}`,
                         position: pos,
                         health: 30,
                         maxHealth: 30,
                         radius: 20,
                         createdAt: now
                     });
                     // Spawn effect
                     game.current.animations.push({ id: `spawn-b-${now}`, type: 'transformFlash', position: pos, createdAt: now, duration: 500, color: '#fbbf24' });
                 }
            }
        } else if (boss.attackState.currentAttack !== 'laserSweep') {
            // Despawn barrels if not laser sweep
            if (game.current.barrels.length > 0) {
                game.current.barrels.forEach(b => {
                     game.current.animations.push({ id: `despawn-b-${b.id}`, type: 'explosion', position: b.position, createdAt: now, duration: 500, color: '#fbbf24' });
                });
                game.current.barrels = [];
            }
        }

        // --- SHIELD DAMAGE LOGIC ---
        // Helper to apply damage to shields first
        const applyDamage = (target: TankType | Boss, amount: number, sourceId?: string) => {
             if (target.status !== 'active') return;
             
             let finalDamage = amount;
             let isCritical = false;

             const attacker = sourceId === 'player' ? game.current.player : game.current.enemies.find(e => e.id === sourceId);

             if (attacker && Math.random() < (attacker.critChance || 0)) {
                isCritical = true;
                finalDamage *= (attacker.critMultiplier || 1);
             }

             game.current.damageNumbers.push({
                id: `dmg-${now}-${Math.random()}`,
                text: Math.round(finalDamage).toString(),
                position: { ...target.position, y: target.position.y - 20 },
                createdAt: now,
                duration: isCritical ? 1200 : 800,
                color: sourceId === 'player' ? (isCritical ? '#ffeb3b' : '#ffffff') : '#f97316',
                isCritical: isCritical
             });
             
             // Shield Check
             if (target.shieldHealth && target.shieldHealth > 0) {
                 target.shieldHealth -= finalDamage;
                 audio.play('shieldHit');
                 game.current.animations.push({ id: `shield-hit-${now}-${Math.random()}`, type: 'shieldHit', position: target.position, createdAt: now, duration: 300, color: '#06b6d4' });
                 
                 if (target.shieldHealth <= 0) {
                     audio.play('shieldBreak');
                     game.current.animations.push({ id: `shield-break-${now}-${Math.random()}`, type: 'shieldBreak', position: target.position, createdAt: now, duration: 600, color: '#06b6d4' });
                     target.shieldHealth = 0; // Clamp
                 }
                 return; // Shield absorbed damage (or broke, but health untouched for this hit)
             }
             
             target.health -= finalDamage;
             target.lastHitTime = now;
             
             if (target.health <= 0) {
                 if ('type' in target && target.type === 'enemy') handleEnemyDeath(target as TankType);
                 else if ('bossType' in target) {
                      // Boss Death
                      target.status = 'dead';
                      game.current.animations.push({ id: `b-die-${now}`, type: 'explosion', position: target.position, createdAt: now, duration: 1000, color: 'red' });
                      audio.play('bossExplosion');
                      audio.stopEngine('boss');
                      setTimeout(() => { game.current.boss = null; }, 1000);
                 }
             }
        };


        const dx = player.position.x - boss.position.x;
        const dy = player.position.y - boss.position.y;
        const dist = Math.hypot(dx, dy);
        const targetAngle = Math.atan2(dy, dx) * (180/Math.PI);

        let angleDiff = targetAngle - boss.angle;
        while (angleDiff <= -180) angleDiff += 360;
        while (angleDiff > 180) angleDiff -= 360;
        boss.angle += angleDiff * 0.05 * timeScale;
        if (boss.attackState.currentAttack !== 'laserSweep' && boss.attackState.currentAttack !== 'omniBarrage') {
             boss.turretAngle = boss.angle; 
        }

        const isStationaryAttack = boss.attackState.currentAttack === 'laserSweep' || boss.attackState.currentAttack === 'shockwave' || boss.attackState.currentAttack === 'omniBarrage' || boss.attackState.phase === 'telegraphing';
        
        if (!isStationaryAttack) {
            const speed = 1.0 * timeScale * diffConfig.speedMultiplier;
            let moveDir = 0;
            if (dist > 350) moveDir = 1; else if (dist < 150) moveDir = -1;
            if (moveDir !== 0) {
                const vx = Math.cos(boss.angle * (Math.PI/180)) * speed * moveDir;
                const vy = Math.sin(boss.angle * (Math.PI/180)) * speed * moveDir;
                boss.position.x += vx; boss.position.y += vy;
                boss.velocity = { x: vx, y: vy };
                boss.position.x = Math.max(50, Math.min(ARENA_WIDTH-50, boss.position.x));
                boss.position.y = Math.max(50, Math.min(ARENA_HEIGHT-50, boss.position.y));
            } else { boss.velocity = {x:0, y:0}; }
        } else { boss.velocity = {x: 0, y: 0}; }

        const isChanneling = boss.attackState.phase === 'attacking' && (boss.attackState.currentAttack === 'laserSweep');
        
        if (!isChanneling && (!boss.lastFireTime || now - boss.lastFireTime > 600 * diffConfig.fireRateMultiplier)) {
            const angle = boss.turretAngle;
            // Goliath Dual Barrels: Offset Fwd 65, Lat +/- 12
            fireProjectileAt(getOffsetPoint(boss.position, angle, 65, 12), angle, boss.id);
            fireProjectileAt(getOffsetPoint(boss.position, angle, 65, -12), angle, boss.id);
            boss.lastFireTime = now;
            audio.play('shot_2', boss.position.x);
        }
        
        const { currentAttack, phase, phaseStartTime, attackData } = boss.attackState;
        if (phase === 'idle' && now > phaseStartTime + (500 / diffConfig.bossAggression)) {
            const rand = Math.random();
            let nextAttack: typeof currentAttack = 'mortarVolley';
            if (dist < 200) { if (rand < 0.7) nextAttack = 'shockwave'; else nextAttack = 'mortarVolley'; }
            else if (dist > 550) { if (rand < 0.5) nextAttack = 'omniBarrage'; else if (rand < 0.8) nextAttack = 'scatterMines'; else nextAttack = 'laserSweep'; } 
            else { if (rand < 0.3) nextAttack = 'mortarVolley'; else if (rand < 0.6) nextAttack = 'scatterMines'; else nextAttack = 'laserSweep'; }

            const targetPos = { ...player.position }; 
            const teleDur = (dur: number) => dur / diffConfig.bossAggression;

            if (nextAttack === 'shockwave') {
                boss.attackState = { currentAttack: nextAttack, phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: teleDur(1500), attackDuration: 500 } };
                // Using new charge sound
                audio.play('bossShockwaveCharge', boss.position.x);
            } else if (nextAttack === 'omniBarrage') {
                boss.attackState = { currentAttack: nextAttack, phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: teleDur(2000), attackDuration: 200 } }; // Replaced Railgun logic
                audio.start('omniCharge'); // New sound
            } else if (nextAttack === 'laserSweep') {
                boss.attackState = { currentAttack: nextAttack, phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: teleDur(1000), attackDuration: 8500, sweepAngleStart: boss.angle, sweepAngleEnd: boss.angle + 360 } };
                audio.play('bossCharge', boss.position.x);
            } else if (nextAttack === 'scatterMines') {
                const count = 10 + Math.floor(Math.random() * 4);
                const telegraphIds: string[] = [];
                for(let i=0; i<count; i++) {
                    const id = `tele-mine-${now}-${i}`;
                    const angle = Math.random() * Math.PI * 2; const radius = 50 + Math.random() * 250;
                    const minePos = { x: Math.max(30, Math.min(ARENA_WIDTH-30, targetPos.x + Math.cos(angle)*radius)), y: Math.max(30, Math.min(ARENA_HEIGHT-30, targetPos.y + Math.sin(angle)*radius)) };
                    game.current.telegraphs.push({ id, type: 'circle', position: minePos, radius: 40, createdAt: now, duration: teleDur(1500), color: '#f97316' });
                    telegraphIds.push(id);
                }
                boss.attackState = { currentAttack: nextAttack, phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: teleDur(1500), telegraphIds: telegraphIds } };
                audio.play('bossWarning', boss.position.x);
                audio.play('mineDeploy', boss.position.x);
            } else {
                const telegraphIds: string[] = [];
                const offsets = [{x:0, y:0}, {x: 60, y: 40}, {x: -60, y: 40}, {x: 60, y: -40}, {x: -60, y: -40}];
                offsets.forEach((off, i) => {
                    const id = `tele-mortar-${now}-${i}`; const pos = { x: targetPos.x + off.x, y: targetPos.y + off.y };
                    game.current.telegraphs.push({ id, type: 'circle', position: pos, radius: 80, createdAt: now, duration: teleDur(1500) });
                    telegraphIds.push(id);
                });
                boss.attackState = { currentAttack: nextAttack, phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: teleDur(1500), telegraphIds: telegraphIds, attackOrigin: targetPos } };
                audio.play('bossCharge', boss.position.x);
            }
        } 
        else if (phase === 'telegraphing') {
            const dur = attackData?.telegraphDuration || 1500; const elapsed = now - phaseStartTime; const progress = elapsed / dur;
            if (currentAttack === 'omniBarrage') {
                // Spin visual during charge?
                boss.turretAngle += 10 * timeScale;
            } else if (currentAttack === 'laserSweep') {
                const angleToPlayer = Math.atan2(player.position.y - boss.position.y, player.position.x - boss.position.x) * (180/Math.PI);
                let angleDiff = angleToPlayer - boss.angle; while (angleDiff <= -180) angleDiff += 360; while (angleDiff > 180) angleDiff -= 360;
                boss.angle += angleDiff * 0.05 * timeScale; boss.turretAngle = boss.angle;
                if (boss.attackState.attackData) { boss.attackState.attackData.sweepAngleStart = boss.angle; boss.attackState.attackData.sweepAngleEnd = boss.angle + 360; }
            }
            if (now > phaseStartTime + dur) {
                boss.attackState.phase = 'attacking'; boss.attackState.phaseStartTime = now;
                if (currentAttack === 'shockwave') {
                    // NEW: Better Impact Audio & Effects
                    audio.play('bossShockwaveFire', boss.position.x); 
                    game.current.screenShake = 45; // Increased shake
                    game.current.animations.push({ id: `shock-${now}`, type: 'shockwave', position: boss.position, createdAt: now, duration: 800, width: 250 });
                    
                    const pDist = Math.hypot(player.position.x - boss.position.x, player.position.y - boss.position.y);
                    if (pDist < 250) {
                        player.health -= 3; 
                        setUiState(prev => ({...prev, playerHealth: player.health}));
                        game.current.damageNumbers.push({id: `dmg-shock-${now}`, text: '3', position: {...player.position}, createdAt: now, duration: 1000, color: '#f00'});
                        
                        // Enhanced Knockback
                        const pushAngle = Math.atan2(player.position.y - boss.position.y, player.position.x - boss.position.x);
                        player.position.x += Math.cos(pushAngle) * 250; 
                        player.position.y += Math.sin(pushAngle) * 250;
                    }
                    setTimeout(() => { if (game.current.boss) { game.current.boss.attackState.phase = 'idle'; game.current.boss.attackState.phaseStartTime = Date.now(); } }, 500);
                } else if (currentAttack === 'omniBarrage') {
                    // Execute Omni Barrage
                    audio.stop('omniCharge');
                    audio.play('omniFire', boss.position.x);
                    game.current.screenShake = 30;
                    
                    const projectileCount = 48; // High density
                    const speed = 8;
                    
                    for(let i=0; i<projectileCount; i++) {
                         const angle = (360 / projectileCount) * i;
                         const rad = angle * (Math.PI/180);
                         const offset = getOffsetPoint(boss.position, angle, 40, 0);
                         
                         game.current.projectiles.push({
                            id: `omni-p-${now}-${i}`, 
                            ownerId: boss.id, 
                            position: offset, 
                            angle: angle, 
                            velocity: { x: Math.cos(rad) * speed, y: Math.sin(rad) * speed }, 
                            size: { width: 12, height: 6 }, 
                            damage: 2, 
                            color: '#ef4444', 
                            createdAt: now
                        });
                    }

                    // Secondary slower wave
                    setTimeout(() => {
                        if (!game.current.boss) return;
                        for(let i=0; i<projectileCount; i++) {
                             const angle = (360 / projectileCount) * i + (180/projectileCount); // Offset angle
                             const rad = angle * (Math.PI/180);
                             const offset = getOffsetPoint(boss.position, angle, 40, 0);
                             
                             game.current.projectiles.push({
                                id: `omni-p2-${now}-${i}`, 
                                ownerId: boss.id, 
                                position: offset, 
                                angle: angle, 
                                velocity: { x: Math.cos(rad) * (speed * 0.6), y: Math.sin(rad) * (speed * 0.6) }, 
                                size: { width: 10, height: 10 }, // Orbs
                                damage: 2, 
                                color: '#ef4444', 
                                createdAt: Date.now()
                            });
                        }
                    }, 200);

                    setTimeout(() => { if (game.current.boss) { game.current.boss.attackState.phase = 'idle'; game.current.boss.attackState.phaseStartTime = Date.now(); } }, 500);
                } else if (currentAttack === 'mortarVolley') {
                    const ids = attackData?.telegraphIds || []; const activeTelegraphs = game.current.telegraphs.filter(t => ids.includes(t.id));
                    audio.play('bossMortarFire', boss.position.x); game.current.screenShake = Math.max(game.current.screenShake, 15);
                    activeTelegraphs.forEach((tele, i) => {
                         // Staggered explosions visually
                         setTimeout(() => {
                            game.current.animations.push({ id: `expl-${now}-${tele.id}`, type: 'mortarStrike', position: tele.position, createdAt: now + i*50, duration: 800 });
                         }, i*30);
                        if (Math.hypot(player.position.x - tele.position.x, player.position.y - tele.position.y) < 80) {
                            applyDamage(player, 3, 'boss');
                        }
                    });
                    game.current.telegraphs = game.current.telegraphs.filter(t => !ids.includes(t.id));
                } else if (currentAttack === 'scatterMines') {
                    audio.play('bossMortarFire', boss.position.x); game.current.screenShake = Math.max(game.current.screenShake, 8);
                    const ids = attackData?.telegraphIds || []; const mineTelegraphs = game.current.telegraphs.filter(t => ids.includes(t.id));
                    mineTelegraphs.forEach((tele, i) => {
                        game.current.animations.push({ id: `mine-expl-${now}-${i}`, type: 'explosion', position: tele.position, createdAt: now + i*100, duration: 600, color: '#f97316' });
                        if (Math.hypot(player.position.x - tele.position.x, player.position.y - tele.position.y) < 60) {
                             applyDamage(player, 2, 'boss');
                        }
                    });
                    game.current.telegraphs = game.current.telegraphs.filter(t => !ids.includes(t.id));
                } else if (currentAttack === 'laserSweep') { audio.start('bossLaserLoop'); }
            }
        } else if (phase === 'attacking') {
            if (currentAttack === 'laserSweep') {
                const dur = attackData?.attackDuration || 3000; const elapsed = now - phaseStartTime; const progress = elapsed / dur;
                if (progress > 1) { audio.stop('bossLaserLoop'); boss.attackState.phase = 'idle'; boss.attackState.phaseStartTime = now; return; }
                const start = attackData?.sweepAngleStart || 0; const end = attackData?.sweepAngleEnd || 0; const currentAngle = start + (end - start) * progress;
                boss.turretAngle = currentAngle;
                if (now - game.current.lastBossBeamTick > 100) { 
                    game.current.lastBossBeamTick = now;
                    const rad = currentAngle * (Math.PI/180); const beamLen = 900;
                    const p1 = getOffsetPoint(boss.position, currentAngle, 65, 0); 
                    const p2 = { x: p1.x + Math.cos(rad) * beamLen, y: p1.y + Math.sin(rad) * beamLen };
                    const playerPos = player.position; const playerRadius = 20;
                    const l2 = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
                    let t = ((playerPos.x - p1.x) * (p2.x - p1.x) + (playerPos.y - p1.y) * (p2.y - p1.y)) / l2;
                    t = Math.max(0, Math.min(1, t));
                    const proj = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
                    const dist = Math.hypot(playerPos.x - proj.x, playerPos.y - proj.y);
                    if (dist < playerRadius + 20) {
                        applyDamage(player, 1, 'boss');
                    }
                }
            } else {
                if (now > phaseStartTime + 500) { boss.attackState.phase = 'idle'; boss.attackState.phaseStartTime = now; }
            }
        }
    };

    const checkCollisions = (now: number) => {
        const g = game.current;

        g.projectiles.forEach(p => {
            if (p.ownerId === 'player') {
                const damage = p.damage || 1;
                let hitSomething = false;

                if (g.boss && g.boss.status === 'active') {
                    if (Math.hypot(p.position.x - g.boss.position.x, p.position.y - g.boss.position.y) < g.boss.size.width/2) {
                        applyDamage(g.boss, damage, 'player');
                        hitSomething = true;
                        
                        if (p.isVampiric && g.player.health < g.player.maxHealth) {
                             g.player.health = Math.min(g.player.maxHealth, g.player.health + 1);
                             setUiState(prev => ({...prev, playerHealth: g.player.health}));
                             g.animations.push({ id: `heal-${now}-${Math.random()}`, type: 'dashTrail', position: g.player.position, createdAt: now, duration: 300, color: '#22c55e' });
                        }
                    }
                }
                if (!hitSomething) {
                    for (const e of g.enemies) {
                         if (e.status !== 'active') continue;
                         if (Math.hypot(p.position.x - e.position.x, p.position.y - e.position.y) < 20) {
                             applyDamage(e, damage, 'player');
                             hitSomething = true;
                             
                             if (p.isVampiric && g.player.health < g.player.maxHealth) {
                                  g.player.health = Math.min(g.player.maxHealth, g.player.health + 1);
                                  setUiState(prev => ({...prev, playerHealth: g.player.health}));
                                  g.animations.push({ id: `heal-${now}-${Math.random()}`, type: 'dashTrail', position: g.player.position, createdAt: now, duration: 300, color: '#22c55e' });
                             }
                             break; 
                         }
                    }
                }

                // Check Barrel Collisions
                if (!hitSomething) {
                    for (let i = 0; i < g.barrels.length; i++) {
                        const b = g.barrels[i];
                        if (Math.hypot(p.position.x - b.position.x, p.position.y - b.position.y) < b.radius + 10) {
                            hitSomething = true;
                            b.health -= damage;
                            g.damageNumbers.push({ id: `dmg-b-${now}-${Math.random()}`, text: Math.round(damage).toString(), position: b.position, createdAt: now, duration: 600, color: '#fbbf24' });
                            audio.play('impact_damage', b.position.x);
                            
                            if (b.health <= 0) {
                                // Explode barrel
                                g.barrels.splice(i, 1);
                                g.animations.push({ id: `expl-b-${now}`, type: 'explosion', position: b.position, createdAt: now, duration: 600, color: '#f59e0b' });
                                audio.play('rocketExplosion', b.position.x);
                                
                                // Damage nearby
                                const blastRadius = 100;
                                [g.player, ...g.enemies, g.boss].forEach(t => {
                                    if (!t || t.status !== 'active') return;
                                    const d = Math.hypot(t.position.x - b.position.x, t.position.y - b.position.y);
                                    if (d < blastRadius) {
                                        applyDamage(t as TankType | Boss, 15, 'barrel');
                                    }
                                });
                            }
                            break;
                        }
                    }
                }

                                if (hitSomething) {
                    
                    // Crystalline Missile Split
                    if (p.isChronoShard) { // Reusing flag for Crystalline
                         // Split into 3 shards
                         for(let i=0; i<3; i++) {
                             const angle = p.angle + (i-1) * 45;
                             const rad = angle * (Math.PI/180);
                             const speed = 10;
                             g.projectiles.push({
                                 id: `shard-${now}-${Math.random()}`,
                                 ownerId: 'player',
                                 position: { ...p.position },
                                 angle: angle,
                                 velocity: { x: Math.cos(rad) * speed, y: Math.sin(rad) * speed },
                                 size: { width: 6, height: 6 },
                                 damage: (p.damage || 2) * 0.5,
                                 color: '#06b6d4',
                                 createdAt: now,
                                 isHoming: false
                             });
                         }
                         audio.play('glassBreak', p.position.x);
                    }

                    // Napalm Missile Impact
                    if (p.isNapalm) {
                         g.effectZones.push({
                             id: `fire-${now}-${Math.random()}`,
                             type: 'fire',
                             position: { ...p.position },
                             radius: 80,
                             createdAt: now,
                             duration: 5000,
                             lastTick: now
                         });
                         audio.play('fireIgnite', p.position.x);
                    }

                    if (p.blastRadius) {
                         audio.play('rocketExplosion', p.position.x);
                         g.animations.push({ id: `aoe-${now}-${Math.random()}`, type: 'explosion', position: p.position, createdAt: now, duration: 400, color: '#ef4444' });
                         [...g.enemies, g.boss].filter(t => t && t.status === 'active').forEach(t => {
                             if (!t) return;
                             const d = Math.hypot(t.position.x - p.position.x, t.position.y - p.position.y);
                             if (d < p.blastRadius!) {
                                 const isDirectHit = d < (('size' in t) ? t.size.width/2 : 20); 
                                 if (!isDirectHit) {
                                      const splashDamage = p.damage || 2;
                                      applyDamage(t as TankType | Boss, splashDamage, 'player');
                                 }
                             }
                         });
                    }
                    p.damage = 0; 
                }
            } else {
                if (g.player.status !== 'active') return;
                const dist = Math.hypot(p.position.x - g.player.position.x, p.position.y - g.player.position.y);
                if (dist < (g.player.size.width / 2)) {
                    const dmg = p.damage || 1;
                    applyDamage(g.player, dmg, p.ownerId);

                    p.damage = 0;

                    const shooter = g.enemies.find(e => e.id === p.ownerId);
                    if (shooter && shooter.status === 'active' && shooter.activePowerUps?.includes('lifeLeech')) {
                        shooter.health = Math.min(shooter.maxHealth, shooter.health + 2);
                        g.damageNumbers.push({ id: `leech-${now}-${shooter.id}`, text: '+LEECH', position: { x: shooter.position.x, y: shooter.position.y - 30 }, createdAt: now, duration: 600, color: '#ef4444' });
                    }

                    const damageConverter = g.abilities.find(a => a.id === 'damageConverter');
                    if (damageConverter && damageConverter.state === 'active') {
                        g.player.damageConverterCharge = Math.min(50, (g.player.damageConverterCharge || 0) + (dmg * 5));
                        g.damageNumbers.push({ id: `charge-${now}-${Math.random()}`, text: '+CHARGE', position: { x: g.player.position.x, y: g.player.position.y + 30 }, createdAt: now, duration: 600, color: '#8b5cf6' });
                        audio.play('uiToggle'); 
                    }
                }
            }
        });
        g.projectiles = g.projectiles.filter(p => (p.damage === undefined || p.damage > 0));
        g.enemies = g.enemies.filter(e => e.status !== 'dead');
    };

        const fireMissile = (ownerId: string, isOverpowered: boolean = false, damageMultiplier: number = 1, isCrystalline: boolean = false, isNapalm: boolean = false) => {
        const g = game.current;
        const source = ownerId === 'player' ? g.player : (ownerId === 'boss' ? g.boss : g.enemies.find(e => e.id === ownerId));
        if (!source || source.status !== 'active') return;

        let targetId = undefined;
        let minD = 9999;
        
        if (ownerId === 'player') {
            if (g.boss && g.boss.status === 'active') {
                 targetId = g.boss.id;
            } else {
                g.enemies.forEach(e => {
                    if (e.status !== 'active') return;
                    const d = Math.hypot(e.position.x - source.position.x, e.position.y - source.position.y);
                    if (d < minD) { minD = d; targetId = e.id; }
                });
            }
        } else {
            if (g.player.status === 'active') {
                targetId = g.player.id;
            }
        }

        const spread = (Math.random() - 0.5) * 60;
        const angle = source.turretAngle + spread;
        const rad = angle * (Math.PI/180);
        
        const isBoss = ownerId === 'boss';
        const speed = MISSILE_SPEED * (isOverpowered ? 1.5 : (isBoss ? 0.65 : 1));
        const damage = (isOverpowered ? 4 : (isBoss ? 2 : 2)) * damageMultiplier;
        const radius = isOverpowered ? 60 : (isBoss ? 30 : 40);
        const color = isNapalm ? '#f97316' : (isCrystalline ? '#06b6d4' : (isOverpowered ? '#fbbf24' : (isBoss ? '#a855f7' : '#ef4444')));
        const turnRate = isBoss ? 3 : (ownerId === 'player' ? 8 : 4);

        const latOffset = Math.random() > 0.5 ? 13 : -13;
        // Pod Offset Forward: Player 6, Enemy 5
        const fwd = isBoss ? 0 : 6;
        const firePos = getOffsetPoint(source.position, source.turretAngle, fwd, latOffset);

        game.current.projectiles.push({
            id: `missile-${Date.now()}-${Math.random()}`, ownerId: ownerId, position: firePos, angle: angle, velocity: { x: Math.cos(rad) * speed, y: Math.sin(rad) * speed }, size: { width: 10, height: 6 }, damage: damage, blastRadius: radius, isHoming: true, turnRate: turnRate, targetId: targetId, color: color, createdAt: Date.now(), isChronoShard: isCrystalline, isNapalm: isNapalm
        });
        audio.play('rocketLaunch', source.position, game.current.player.position);
    };

    const fireProjectileAt = (position: Vector, angle: number, ownerId: string) => {
        const rad = angle * (Math.PI/180);
        let damage = 1;
        let speed = PROJECTILE_SPEED;
                let color = undefined;


        if (ownerId === 'player') {
             damage = 2;
             const overdrive = game.current.abilities.find(a => a.id === 'overdrive');
                          if (overdrive && overdrive.state === 'active') {
                 damage = 4; speed *= 1.2; color = '#fbbf24';
             }


             const charge = game.current.player.damageConverterCharge || 0;
             if (charge > 0) {
                 damage += charge * 0.2; color = '#8b5cf6';
                 game.current.player.damageConverterCharge = Math.max(0, charge - 2); 
             }
             if (game.current.player.activePowerUps?.includes('dualCannon')) {
                 color = '#f97316'; damage += 1;
             }
             if (game.current.player.bossType === 'goliath' || game.current.player.chassis === 'goliath-prime-overdrive') {
                 damage = 4; color = '#ef4444'; speed *= 1.1;
             }
        } else if (ownerId === 'boss') {
             damage = 2; speed *= 1.15; color = '#ef4444';
        } else {
            color = '#FF003C';
        }

        game.current.projectiles.push({
                        id: `p-${Date.now()}-${Math.random()}`, ownerId: ownerId, position: { ...position }, angle: angle, velocity: { x: Math.cos(rad)*speed, y: Math.sin(rad)*speed }, size: { width: 8, height: 8 }, damage: damage, color: color, createdAt: Date.now()
        });
        
        if (ownerId === 'player') {
            if (game.current.player.activePowerUps?.includes('dualCannon') || game.current.player.bossType === 'goliath' || game.current.player.chassis === 'goliath-prime-overdrive') 
                audio.play('dualCannon', position, game.current.player.position);
            else 
                audio.play(`shot_${Math.floor(Math.random() * 5) + 1}`, position, game.current.player.position);
        } else {
            audio.play('shot_5', position, game.current.player.position);
        }
    };

    const fireProjectile = (owner: TankType, angle: number) => {
        const isGoliath = (owner.bossType === 'goliath' && owner.type === 'player') || owner.chassis === 'goliath-prime' || owner.chassis === 'goliath-prime-overdrive';
        const isTrueForm = owner.chassis === 'goliath-prime-overdrive';
        const activePowerUps = owner.activePowerUps || [];

        // Automatic Homing Missiles Trigger (works for player and enemies)
        if (activePowerUps.includes('homingMissiles') && (owner.homingMissileCount || 0) > 0) {
             // FUSED POWERUP: Dual Missiles (Dual Cannon + Homing Missiles)
             if (activePowerUps.includes('dualCannon')) {
                 // Fire 2 missiles at once
                 fireMissile(owner.id, false);
                 setTimeout(() => fireMissile(owner.id, false), 100);
                 owner.homingMissileCount = (owner.homingMissileCount || 0) - 2;
             } else {
                 fireMissile(owner.id, false); 
                 owner.homingMissileCount = (owner.homingMissileCount || 0) - 1;
             }
             // Don't consume primary fire, allow simultaneous firing
        }

        if (isGoliath) {
            // Inner Barrels (Standard)
            fireProjectileAt(getOffsetPoint(owner.position, angle, 65, 12), angle, owner.id);
            fireProjectileAt(getOffsetPoint(owner.position, angle, 65, -12), angle, owner.id);
            
            // Outer Barrels (Dual Cannon Powerup -> Quad Cannon OR Overdrive Mode)
            if (activePowerUps.includes('dualCannon') || isTrueForm) {
                // UNIQUE INTERACTION: True Form Dual Cannon Buff (Hex Cannon)
                if (isTrueForm && activePowerUps.includes('dualCannon')) {
                    // Extra pair of shots for ultimate destruction
                    fireProjectileAt(getOffsetPoint(owner.position, angle, 55, 36), angle, owner.id);
                    fireProjectileAt(getOffsetPoint(owner.position, angle, 55, -36), angle, owner.id);
                }
                
                fireProjectileAt(getOffsetPoint(owner.position, angle, 60, 24), angle, owner.id);
                fireProjectileAt(getOffsetPoint(owner.position, angle, 60, -24), angle, owner.id);
            }
        } else if (activePowerUps.includes('dualCannon')) {
            fireProjectileAt(getOffsetPoint(owner.position, angle, 32, 6), angle, owner.id);
            fireProjectileAt(getOffsetPoint(owner.position, angle, 32, -6), angle, owner.id);
        } else {
            fireProjectileAt(getOffsetPoint(owner.position, angle, 30, 0), angle, owner.id);
        }
    }

    const spawnEnemy = () => {
        const x = Math.random() * (ARENA_WIDTH - 100) + 50;
        const tier = Math.random() < diffConfig.tierChance ? 'intermediate' : 'basic';
        const color = tier === 'intermediate' ? '#f97316' : '#FF003C';
        const baseHp = tier === 'intermediate' ? 30 : 15;
        const health = baseHp * diffConfig.hpMultiplier;

        const enemy: TankType = {
            id: `e-${Date.now()}`, name: generateUsername(), type: 'enemy', status: 'spawning', spawnTime: Date.now(), position: { x, y: 50 }, velocity: {x:0,y:0}, angle: 90, turretAngle: 90, size: {width:40, height:40}, tier: tier, health: health, maxHealth: health, color: color, score: 0, kills: 0, deaths: 0, lastFireTime: 0, aiMode: 'engage', aiStrafeDir: Math.random() > 0.5 ? 1 : -1, aiStateTimer: Date.now() + Math.random() * 2000,
            critChance: 0.05,
            critMultiplier: 1.5
        };

        if (Math.random() < 0.3) {
            const possiblePowerUps: PowerUpType[] = ['homingMissiles', 'shield', 'dualCannon', 'lifeLeech', 'regensule'];
            const type = possiblePowerUps[Math.floor(Math.random() * possiblePowerUps.length)];
            enemy.activePowerUps = [type];
            if (type === 'homingMissiles') enemy.homingMissileCount = 10;
            if (type === 'shield') enemy.shieldHealth = 5;
        }

        game.current.enemies.push(enemy);
    };

    const spawnDuelEnemy = (name: string, tier: 'basic' | 'intermediate' | undefined, chassis?: ChassisType) => {
        game.current.enemies.push({
            id: `duel-enemy`, 
            name: name, 
            type: 'enemy', 
            status: 'active', 
            spawnTime: 0, 
            position: { x: ARENA_WIDTH / 2, y: 150 }, 
            velocity: {x:0,y:0}, 
            angle: 90, 
            turretAngle: 90, 
            size: {width: 50, height: 50}, 
            tier: tier, 
            health: tier === 'intermediate' ? 300 : 150, 
            maxHealth: tier === 'intermediate' ? 300 : 150, 
            color: tier === 'intermediate' ? '#f97316' : '#FF003C', 
            score: 0, kills: 0, deaths: 0, lastFireTime: 0, aiMode: 'engage', aiStrafeDir: 1, aiStateTimer: 0,
            critChance: 0.05,
            critMultiplier: 1.5,
            chassis: chassis // Apply visual chassis override
        });
    };

    const spawnBoss = (type: 'goliath' | 'viper' | 'sentinel', position?: Vector) => {
        const hp = 1200 * diffConfig.bossHpMultiplier;
        const bossId = `boss-${Date.now()}-${Math.random()}`;
        const boss: Boss = {
            id: bossId, 
            name: type.toUpperCase(), 
            bossType: type, 
            position: position || { x: ARENA_WIDTH/2, y: 150 }, 
            velocity: {x:0,y:0}, 
            angle: 90, 
            turretAngle: 90, 
            size: { width: 110, height: 110 }, 
            health: hp, 
            maxHealth: hp, 
            color: '#ef4444', 
            status: 'spawning', 
            spawnTime: Date.now(), 
            attackState: { currentAttack: 'none', phase: 'idle', phaseStartTime: Date.now() }
        };
        game.current.bosses.push(boss);
        audio.play('bossSpawn');
    };

    const sandboxActions = {
        toggleGodMode: () => {
            game.current.sandbox.godMode = !game.current.sandbox.godMode;
            audio.play('uiClick');
        },
        toggleInfiniteEnergy: () => {
            game.current.sandbox.infiniteEnergy = !game.current.sandbox.infiniteEnergy;
            audio.play('uiClick');
        },
        setTimeScale: (val: number) => {
            game.current.sandbox.timeScale = val;
            audio.play('uiClick');
        },
        setSpawnMode: (mode: string) => {
            game.current.sandbox.spawnMode = mode;
            audio.play('uiClick');
        },
        spawnPowerUp: (type: PowerUpType, position?: Vector) => {
            const pos = position || {
                x: Math.random() * (ARENA_WIDTH - 200) + 100,
                y: Math.random() * (ARENA_HEIGHT - 200) + 100
            };
            game.current.powerUps.push({
                id: `pup-${Date.now()}-${Math.random()}`,
                type,
                position: pos,
                spawnTime: Date.now()
            });
            audio.play('powerUpSpawn');
        },
        spawnEnemy: (tier: 'basic' | 'intermediate', position?: Vector) => {
            const pos = position || {
                x: Math.random() * (ARENA_WIDTH - 100) + 50,
                y: 50
            };
            const color = tier === 'intermediate' ? '#f97316' : '#FF003C';
            const baseHp = tier === 'intermediate' ? 30 : 15;
            const health = baseHp * diffConfig.hpMultiplier;

            const enemy: TankType = {
                id: `e-${Date.now()}`, name: generateUsername(), type: 'enemy', status: 'active', spawnTime: 0, position: pos, velocity: {x:0,y:0}, angle: 90, turretAngle: 90, size: {width:40, height:40}, tier: tier, health: health, maxHealth: health, color: color, score: 0, kills: 0, deaths: 0, lastFireTime: 0, aiMode: 'engage', aiStrafeDir: Math.random() > 0.5 ? 1 : -1, aiStateTimer: Date.now() + Math.random() * 2000,
                critChance: 0.05,
                critMultiplier: 1.5
            };
            game.current.enemies.push(enemy);
            audio.play('uiClick');
        },
        spawnBoss: (position?: Vector) => {
            spawnBoss('goliath', position);
        },
        clearAll: () => {
            game.current.enemies = [];
            game.current.projectiles = [];
            game.current.bosses = [];
            game.current.powerUps = [];
            game.current.effectZones = [];
            game.current.animations = [];
            audio.play('bossExplosion');
        },
        healPlayer: () => {
            game.current.player.health = game.current.player.maxHealth;
            audio.play('abilityReady');
        }
    };

    // --- INPUT HANDLERS ---
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            game.current.keys[e.key.toLowerCase()] = true;

            // Sandbox Panel Toggle
            if (e.key === 'Tab' && config.mode === 'sandbox') {
                e.preventDefault();
                setIsSandboxPanelOpen(prev => !prev);
                audio.play('uiClick');
            }

            if (game.current.player.status !== 'active') return;

            // Cutscene Trigger for Goliath Prime in Sandbox
            if (e.key.toLowerCase() === 'x' && 
                config.mode === 'sandbox' && 
                config.sandboxConfig?.characterId === 'goliath-prime' &&
                !game.current.cutscene.active &&
                game.current.player.chassis !== 'goliath-prime-overdrive') {
                
                // Requirement: 30% HP or lower
                const hpPercent = game.current.player.health / game.current.player.maxHealth;
                if (hpPercent > 0.3) {
                    audio.play('uiBack'); // Error/Deny sound
                    // Visual feedback
                    game.current.damageNumbers.push({
                        id: `limit-lock-${Date.now()}`,
                        text: 'LIMITER LOCKED',
                        position: { ...game.current.player.position, y: game.current.player.position.y - 60 },
                        createdAt: Date.now(),
                        duration: 1000,
                        color: '#fbbf24'
                    });
                    return;
                }
                    
                game.current.cutscene = {
                    active: true,
                    phase: 'intro',
                    startTime: Date.now(),
                    dialogueText: '',
                    dialogueIndex: 0,
                    targetCamera: { x: game.current.player.position.x, y: game.current.player.position.y, zoom: 2.0 }
                };
                return;
            }

            if (game.current.cutscene.active) return; // Block input during cutscene

            if (e.key.toLowerCase() === 'q') triggerAbility(game.current.abilities[0]?.id || 'overdrive');
            if (e.key.toLowerCase() === 'e') triggerAbility(game.current.abilities[1]?.id);
            if (e.key.toLowerCase() === 'r') triggerAbility(game.current.abilities[2]?.id || 'damageConverter');
            if (e.key.toLowerCase() === 'f') triggerAbility(game.current.abilities[3]?.id || 'missileBarrage');
            if (e.key.toLowerCase() === 't') triggerAbility('scatterMines');
            if (e.key.toLowerCase() === 'y') triggerAbility(game.current.player.bossType === 'goliath' ? 'nanoSwarm' : 'teslaStorm');
            
            if ((e.key === ' ' || e.code === 'Space') && !e.repeat) fireProjectile(game.current.player, game.current.player.turretAngle);
        };
        
        const onKeyUp = (e: KeyboardEvent) => {
            game.current.keys[e.key.toLowerCase()] = false;
            
            if (game.current.cutscene.active) return;


        };
        const onMouseMove = (e: MouseEvent) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                // Adjust mouse pos for canvas scaling due to camera/cutscene
                // NOTE: Camera transform complicates mouse mapping.
                // Current logic maps screen pixels to canvas 0-1000 coords.
                // If we implement camera, we need inverse transform here.
                // Simplified: Camera is center-focused.
                
                const scaleX = canvasRef.current!.width / rect.width;
                const scaleY = canvasRef.current!.height / rect.height;
                const canvasX = (e.clientX - rect.left) * scaleX;
                const canvasY = (e.clientY - rect.top) * scaleY;
                
                const g = game.current;
                
                if (g.cutscene.active || g.camera.zoom !== 1) {
                    const cx = ARENA_WIDTH / 2;
                    const cy = ARENA_HEIGHT / 2;
                    // Apply inverse camera
                    const zoom = g.camera.zoom;
                    const tx = g.camera.x;
                    const ty = g.camera.y;
                    
                    // Transform: Translate(cx,cy) -> Scale(z) -> Translate(-tx,-ty)
                    // Inverse: Translate(tx,ty) -> Scale(1/z) -> Translate(-cx,-cy)
                    
                    const worldX = (canvasX - cx) / zoom + tx;
                    const worldY = (canvasY - cy) / zoom + ty;
                    
                    g.mouse = { x: worldX, y: worldY };
                } else {
                    g.mouse = { x: canvasX, y: canvasY };
                }
            }
        };
        const onMouseDown = () => {}

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mousedown', onMouseDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mousedown', onMouseDown);
        };
    }, []);

    const triggerAbility = (id: string) => {
        const now = Date.now();
        const ab = game.current.abilities.find(a => a.id === id);
        const isTrueForm = game.current.player.chassis === 'goliath-prime-overdrive';

        if (ab && ab.state === 'ready') {
            if (id === 'cyberBeam') {
                ab.state = 'charging';
                ab.startTime = Date.now();
                audio.start('beamCharge');
                game.current.combatText.push({ id: `ct-${now}`, text: 'CYBER BEAM', createdAt: now, duration: 2000, color: '#d946ef', isCritical: true });
                return;
            }

            ab.state = 'active';
            ab.startTime = Date.now();
            ab.firedCount = 0; 
            
            if (id === 'shockwave') {
                // Using new Sound
                audio.play('bossShockwaveFire');
                game.current.screenShake = 30;
                
                // TRUE FORM COMBO: Hellfire Stomp
                if (isTrueForm) {
                    game.current.screenShake = 50;
                    // Spawn Persistent Fissure
                    game.current.effectZones.push({
                        id: `fissure-${Date.now()}`,
                        type: 'fissure',
                        position: { ...game.current.player.position },
                        radius: 300,
                        createdAt: Date.now(),
                        duration: 5000,
                        lastTick: 0
                    });
                }

                game.current.animations.push({ id: `shock-${Date.now()}`, type: 'shockwave', position: game.current.player.position, createdAt: Date.now(), duration: 600, width: 250 });
                game.current.enemies.forEach(e => {
                    if (Math.hypot(e.position.x - game.current.player.position.x, e.position.y - game.current.player.position.y) < 250) {
                        e.health -= 10;
                        game.current.damageNumbers.push({id: `sw-${Date.now()}-${e.id}`, text: '10', position: e.position, createdAt: Date.now(), duration: 1000, color: '#f00'});
                        const angle = Math.atan2(e.position.y - game.current.player.position.y, e.position.x - game.current.player.position.x);
                        e.position.x += Math.cos(angle) * 150; e.position.y += Math.sin(angle) * 150;
                        if (e.health <= 0) handleEnemyDeath(e);
                    }
                });
            } else if (id === 'mortarVolley') {
                audio.play('bossMortarFire');
                const offsets = [{x:0, y:0}, {x: 40, y: 30}, {x: -40, y: 30}, {x: 40, y: -30}, {x: -40, y: -30}];
                
                // TRUE FORM COMBO: Orbital Saturation
                if (isTrueForm) {
                    // Instant Orbital Beams instead of shells
                    offsets.forEach((off, i) => {
                        const targetPos = { x: game.current.mouse.x + off.x * 1.5, y: game.current.mouse.y + off.y * 1.5 }; // Wider spread
                         setTimeout(() => {
                             // Instant Damage
                             audio.play('shot_5'); // Placeholder beam sound
                             game.current.animations.push({ id: `orbital-${Date.now()}-${i}`, type: 'orbitalBeam', position: targetPos, createdAt: Date.now(), duration: 800 });
                             game.current.screenShake = 5;
                             
                             game.current.enemies.forEach(e => {
                                if (Math.hypot(e.position.x - targetPos.x, e.position.y - targetPos.y) < 100) {
                                    e.health -= 25; // Massive damage
                                    e.lastHitTime = Date.now();
                                    game.current.damageNumbers.push({id: `orb-${Date.now()}-${e.id}-${i}`, text: '25', position: e.position, createdAt: Date.now(), duration: 1000, color: '#fbbf24'});
                                    if (e.health <= 0) handleEnemyDeath(e);
                                }
                            });
                         }, i * 100);
                    });
                } else {
                    // Standard Mortar
                    offsets.forEach((off, i) => {
                        const targetPos = { x: game.current.mouse.x + off.x, y: game.current.mouse.y + off.y };
                        setTimeout(() => {
                            game.current.animations.push({ id: `mortar-${Date.now()}-${i}`, type: 'mortarStrike', position: targetPos, createdAt: Date.now(), duration: 800 });
                            setTimeout(() => {
                                if (i === 0) { game.current.screenShake = 15; audio.play('rocketExplosion'); }
                                 game.current.enemies.forEach(e => {
                                    if (Math.hypot(e.position.x - targetPos.x, e.position.y - targetPos.y) < 80) {
                                        e.health -= 10;
                                        game.current.damageNumbers.push({id: `mt-${Date.now()}-${e.id}-${i}`, text: '10', position: e.position, createdAt: Date.now(), duration: 1000, color: '#f00'});
                                        if (e.health <= 0) handleEnemyDeath(e);
                                    }
                                });
                            }, 400); 
                        }, i * 50);
                    });
                }

            } else if (id === 'laserSweep') {
                audio.play('bossLaserStart'); 
                audio.start('bossLaserLoop');
            } else if (id === 'scatterMines') {
                audio.play('mineDeploy');
                for(let i=0; i<8; i++) {
                    const angle = (Math.PI * 2 / 8) * i; const radius = 80;
                    const minePos = { x: Math.max(20, Math.min(ARENA_WIDTH-20, game.current.mouse.x + Math.cos(angle) * radius)), y: Math.max(20, Math.min(ARENA_HEIGHT-20, game.current.mouse.y + Math.sin(angle) * radius)) };
                    game.current.telegraphs.push({ id: `mine-player-${Date.now()}-${i}`, type: 'circle', position: minePos, radius: 30, createdAt: Date.now(), duration: 12000, color: '#f97316' });
                }
            } else if (id === 'nanoSwarm') {
                audio.play('shot_1'); 
                const count = isTrueForm ? 24 : 12;
                const damage = isTrueForm ? 2 : 1;
                const speed = isTrueForm ? 16 : 12;

                for(let i=0; i<count; i++) {
                    setTimeout(() => {
                        if (!game.current.player || game.current.player.status !== 'active') return;
                        
                        // Play sound for each swarm missile
                        audio.play('shot_4', game.current.player.position.x);

                        const angle = game.current.player.turretAngle + (Math.random() - 0.5) * 90; const rad = angle * (Math.PI/180);
                        game.current.projectiles.push({
                            id: `nano-${Date.now()}-${i}`, ownerId: 'player', position: { ...game.current.player.position }, angle: angle, velocity: { x: Math.cos(rad) * speed, y: Math.sin(rad) * speed }, size: { width: 6, height: 6 }, damage: damage, isHoming: true, turnRate: 15, isVampiric: true, color: '#22c55e', createdAt: Date.now()
                        });
                    }, i * (isTrueForm ? 25 : 50));
                }
            } else if (id === 'overdrive') {
                audio.play('overdrive'); audio.start('overdriveLoop');
            } else if (id === 'missileBarrage' || id === 'teslaStorm') {
                audio.play('abilityReady'); 
            } else if (id === 'damageConverter') {
                audio.play('shieldHit'); 
            } else {
                audio.play('uiClick');
            }
            
            if (id === 'overdrive') {
                game.current.combatText.push({ id: `ct-${now}`, text: 'OVERDRIVE', createdAt: now, duration: 2000, color: '#f59e0b', isCritical: true });
                const oldHp = game.current.player.health;
                game.current.player.health = Math.min(game.current.player.maxHealth, oldHp + 2);
                if (game.current.player.health > oldHp) {
                    game.current.damageNumbers.push({ id: `heal-${now}`, text: 'REPAIR', position: { ...game.current.player.position, y: game.current.player.position.y - 40 }, createdAt: now, duration: 1000, color: '#4ade80' });
                    setUiState(prev => ({...prev, playerHealth: game.current.player.health}));
                }
            } else if (id === 'missileBarrage') {
                game.current.combatText.push({ id: `ct-${now}`, text: 'MISSILE BARRAGE', createdAt: now, duration: 2000, color: '#ef4444', isCritical: true });
            } else if (id === 'teslaStorm') {
                game.current.combatText.push({ id: `ct-${now}`, text: 'TESLA STORM', createdAt: now, duration: 2000, color: '#00F0FF', isCritical: true });
            } else if (id === 'phaseShift') {
                game.current.combatText.push({ id: `ct-${now}`, text: 'PHASE SHIFT', createdAt: now, duration: 2000, color: '#a855f7', isCritical: true });
            } else if (id === 'flamethrower') {
                game.current.combatText.push({ id: `ct-${now}`, text: 'FLAMETHROWER', createdAt: now, duration: 2000, color: '#ef4444', isCritical: true });
            } else if (id === 'chainLightning') {
                game.current.combatText.push({ id: `ct-${now}`, text: 'CHAIN LIGHTNING', createdAt: now, duration: 2000, color: '#eab308', isCritical: true });
                        } else if (id === 'prismGuard') {
                game.current.combatText.push({ id: `ct-${now}`, text: 'PRISM GUARD', createdAt: now, duration: 2000, color: '#06b6d4', isCritical: true });
                        } else if (id === 'toxicRounds') {
                const overdriveActive = game.current.abilities.find(a => a.id === 'overdrive')?.state === 'active';
                game.current.combatText.push({ id: `ct-${now}`, text: overdriveActive ? 'NAPALM VOLLEY' : 'TOXIC ROUNDS', createdAt: now, duration: 2000, color: '#ef4444', isCritical: true });
                const numMissiles = 6;
                for (let i = 0; i < numMissiles; i++) {
                    setTimeout(() => {
                        fireMissile('player', false, 0.5, false, overdriveActive);
                    }, i * 100); // Stagger the missiles
                }
            }
            setUiState(prev => ({...prev, abilities: [...game.current.abilities]}));
        }
    };

    // --- DRAW ---
    const draw = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
        const g = game.current;
        const now = Date.now();

        // CAMERA TRANSFORM
        ctx.save();
        
        let shakeX = 0, shakeY = 0;
        if (g.screenShake > 0) {
            if (settings.screenShake) {
                shakeX = Math.random() * g.screenShake - g.screenShake / 2;
                shakeY = Math.random() * g.screenShake - g.screenShake / 2;
            }
            g.screenShake *= 0.9;
            if (g.screenShake < 0.5) g.screenShake = 0;
        }

        // Center Camera logic
        const cx = ARENA_WIDTH / 2;
        const cy = ARENA_HEIGHT / 2;
        
        ctx.translate(cx, cy);
        ctx.scale(g.camera.zoom, g.camera.zoom);
        ctx.translate(-g.camera.x + shakeX, -g.camera.y + shakeY);


        drawGrid(ctx, ARENA_WIDTH, ARENA_HEIGHT, 50);
        drawEffectZones(ctx, g.effectZones, now);
        drawTelegraphs(ctx, g.telegraphs, now);
        
        if (g.boss) { drawBoss(ctx, g.boss, now, false); drawLastStandWarning(ctx, g.boss, now); }
        g.enemies.forEach(e => drawTank(ctx, e, now, [], false));
        drawTank(ctx, g.player, now, g.abilities, false);
        
        // Draw Barrels
        g.barrels.forEach(b => drawBarrel(ctx, b));

        const beamAbility = g.abilities.find(a => a.id === 'cyberBeam');
        const overdriveActive = g.abilities.find(a => a.id === 'overdrive')?.state === 'active';
        
        if (beamAbility && (beamAbility.state === 'charging' || beamAbility.state === 'active')) {
            drawCyberBeam(ctx, g.player, g.mouse, now, beamAbility.state, beamAbility.startTime || 0, beamAbility.chargeDuration, overdriveActive);
        }
        
        const sweepAbility = g.abilities.find(a => a.id === 'laserSweep' && a.state === 'active');
        if (sweepAbility) {
            const isTrueForm = g.player.chassis === 'goliath-prime-overdrive';
            const tipOffset = (g.player.bossType === 'goliath' || isTrueForm) ? 65 : 30;
            
            // Draw Main Beam
            const firePos = getOffsetPoint(g.player.position, g.player.turretAngle, tipOffset, 0);
            drawLaserSweep(ctx, firePos, g.player.turretAngle, isTrueForm ? '#fbbf24' : '#ef4444');
            
            // Draw X-Pattern beams if True Form
            if (isTrueForm) {
                // We draw 3 additional beams at 90 deg offsets to make the X (plus the main one)
                for(let i=1; i<4; i++) {
                    const angle = g.player.turretAngle + (i * 90);
                    const pos = getOffsetPoint(g.player.position, angle, tipOffset, 0);
                    drawLaserSweep(ctx, pos, angle, '#fbbf24');
                }
            }
        }

        g.projectiles.forEach(p => drawProjectile(ctx, p, undefined, false));
        g.powerUps.forEach(p => drawPowerUp(ctx, p, now));
        drawAnimations(ctx, g.animations, now);
        drawDamageNumbers(ctx, g.damageNumbers, now);

        // Restore camera
        ctx.restore();
        
        // Draw Combat Text outside camera but inside canvas coordinate space
        drawCombatText(ctx, g.combatText);
        
        // UI Overlay for Cutscene
        if (g.cutscene.active) {
            drawCutsceneOverlay(ctx, ARENA_WIDTH, ARENA_HEIGHT, g.cutscene);
        }
    };

    return (
        <div className="relative w-full h-screen bg-[#111] overflow-hidden flex items-center justify-center cursor-none">
            <canvas ref={canvasRef} width={ARENA_WIDTH} height={ARENA_HEIGHT} className="bg-[#1a1a1a] shadow-2xl shadow-black border border-[#333]" />
            {!game.current.cutscene.active && (
                <>
                    <HUD enemiesRemaining={uiState.enemiesRemaining} />
                    <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-4 pointer-events-none">
                        <Leaderboard player={{...game.current.player, score: uiState.playerScore}} enemies={game.current.enemies} boss={game.current.boss} />
                        <KillFeed messages={game.current.killFeed} />
                    </div>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 h-[75%] w-80 z-20 pointer-events-none">
                        <AbilityHotbar abilities={uiState.abilities.length ? uiState.abilities : game.current.abilities} damageConverterCharge={uiState.damageConverterCharge} /> 
                    </div>
                    {game.current.boss && <BossHealthBar boss={game.current.boss} />}
                </>
            )}

            {config.mode === 'sandbox' && (
                <>
                    <button 
                        onClick={() => setIsSandboxPanelOpen(prev => !prev)}
                        className="absolute right-4 bottom-4 z-30 w-12 h-12 bg-black/50 border border-[var(--color-primary-cyan)]/50 flex items-center justify-center text-[var(--color-primary-cyan)] hover:bg-[var(--color-primary-cyan)]/20 transition-all shadow-[0_0_10px_rgba(0,224,255,0.2)]"
                        title="Sandbox Panel [TAB]"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </button>
                    <SandboxPanel 
                        isOpen={isSandboxPanelOpen} 
                        onClose={() => setIsSandboxPanelOpen(false)} 
                        actions={sandboxActions}
                        settings={game.current.sandbox}
                    />
                </>
            )}
            
            {/* Cutscene Prompt for Sandbox Goliath - Shows only when HP <= 30% */}
            {!game.current.cutscene.active && config.mode === 'sandbox' && config.sandboxConfig?.characterId === 'goliath-prime' && game.current.player.chassis !== 'goliath-prime-overdrive' && (game.current.player.health / game.current.player.maxHealth <= 0.3) && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none animate-pulse z-20">
                    <p className="text-yellow-400 font-orbitron font-bold text-sm tracking-widest bg-black/50 px-4 py-1 rounded border border-yellow-500/50 shadow-[0_0_10px_#eab308]">⚠ LIMITER DISENGAGED: PRESS [X] ⚠</p>
                </div>
            )}

            {uiState.gameOver && (
                <GameOverScreen score={uiState.playerScore} kills={uiState.playerKills} onRestart={() => navigateTo('game')} onMainMenu={() => navigateTo('main-menu')} />
            )}
        </div>
    );
};

export default GameScreen;

const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const drawCombatText = (ctx: CanvasRenderingContext2D, combatText: CombatText[]) => {
    combatText.forEach(ct => {
        const now = Date.now();
        const elapsed = now - ct.createdAt;
        if (elapsed > ct.duration) return;

        const fadeDuration = 300; // ms
        const moveDuration = ct.duration;

        // Fade in and out
        let alpha = 1.0;
        if (elapsed < fadeDuration) {
            alpha = elapsed / fadeDuration;
        } else if (elapsed > ct.duration - fadeDuration) {
            alpha = (ct.duration - elapsed) / fadeDuration;
        }

        // Upward movement
        const yPos = (ARENA_HEIGHT / 2) - 50 - (elapsed / moveDuration) * 100;

        ctx.save();
        ctx.font = ct.isCritical ? 'bold 48px Russo One, sans-serif' : 'bold 32px Russo One, sans-serif';
        ctx.fillStyle = hexToRgba(ct.color, alpha);
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillText(ct.text, ARENA_WIDTH / 2, yPos);
        ctx.restore();
    });
};

function updateEnemyAI(e: TankType, player: TankType, powerUps: PowerUp[], now: number, timeScale: number, diffConfig: any, onFire: () => void): void {
    if (e.status !== 'active' || player.status !== 'active') return;

    const distToPlayer = Math.hypot(player.position.x - e.position.x, player.position.y - e.position.y);
    const angleToPlayer = Math.atan2(player.position.y - e.position.y, player.position.x - e.position.x) * (180/Math.PI);
    
    // Turret tracks player always
    let angleDiff = angleToPlayer - e.turretAngle;
    while (angleDiff <= -180) angleDiff += 360;
    while (angleDiff > 180) angleDiff -= 360;
    e.turretAngle += angleDiff * (0.1 + diffConfig.aiTracking) * timeScale;
    
    // Power-up Detection
    let targetPos = player.position;
    let isScavenging = false;
    
    // Only seek powerups if we don't have one
    if (!e.activePowerUps || e.activePowerUps.length === 0) {
        let minDist = 400; // Detection range
        for (const p of powerUps) {
            const d = Math.hypot(p.position.x - e.position.x, p.position.y - e.position.y);
            if (d < minDist) {
                minDist = d;
                targetPos = p.position;
                isScavenging = true;
            }
        }
    }

    if (now > (e.aiStateTimer || 0)) {
        e.aiStateTimer = now + 1000 + Math.random() * 2000;
        const rand = Math.random();
        if (distToPlayer > 400) e.aiMode = 'engage';
        else if (distToPlayer < 150) e.aiMode = 'flank';
        else e.aiMode = rand > 0.6 ? 'strafe' : 'engage';
        if (e.aiMode === 'strafe') e.aiStrafeDir = Math.random() > 0.5 ? 1 : -1;
    }

    const speed = (e.tier === 'intermediate' ? 1.5 : 2.0) * diffConfig.speedMultiplier * timeScale;
    let shouldMove = false;
    let targetMoveAngle = e.angle;

    if (isScavenging) {
        shouldMove = true;
        targetMoveAngle = Math.atan2(targetPos.y - e.position.y, targetPos.x - e.position.x) * (180 / Math.PI);
    } else {
        if (e.aiMode === 'engage') {
            if (distToPlayer > 200) {
                shouldMove = true;
                targetMoveAngle = angleToPlayer;
            }
        } else if (e.aiMode === 'strafe') {
            shouldMove = true;
            targetMoveAngle = angleToPlayer + 90 * (e.aiStrafeDir || 1);
        } else if (e.aiMode === 'flank') {
            shouldMove = true;
            targetMoveAngle = angleToPlayer + 180 + (Math.random() * 60 - 30);
        }
    }

    if (shouldMove) {
        let diff = targetMoveAngle - e.angle;
        while (diff <= -180) diff += 360;
        while (diff > 180) diff -= 360;
        e.angle += diff * 0.1 * timeScale; // Smooth turn
        
        const rad = e.angle * (Math.PI / 180);
        const vx = Math.cos(rad) * speed;
        const vy = Math.sin(rad) * speed;
        
        e.position.x += vx;
        e.position.y += vy;
        e.velocity = {x: vx, y: vy};
        
        // Bounds check
        e.position.x = Math.max(30, Math.min(ARENA_WIDTH - 30, e.position.x));
        e.position.y = Math.max(30, Math.min(ARENA_HEIGHT - 30, e.position.y));
    } else {
        e.velocity = {x: 0, y: 0};
    }

    // Fire logic
    if (!e.lastFireTime || now - e.lastFireTime > (e.tier === 'intermediate' ? 1500 : 2500) * diffConfig.fireRateMultiplier) {
        // Fire if aiming roughly at player
        if (Math.abs(angleDiff) < 30 && distToPlayer < 700) {
            onFire();
            e.lastFireTime = now;
        }
    }
}
