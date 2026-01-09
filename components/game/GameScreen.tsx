
import React, { useState, useEffect, useRef } from 'react';
import type { Screen, Ability, Tank as TankType, Projectile, Vector, Animation, PowerUp, Boss, Telegraph, EffectZone, GameConfig, UIState, Minion, DamageNumber, PowerUpType } from '../../types';
import { Difficulty } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { useAudio } from '../../contexts/AudioContext';

import HUD from './HUD';
import AbilityHotbar from './AbilityHotbar';
import { drawTank, drawProjectile, drawGrid, drawAnimations, drawPowerUp, drawBoss, drawTelegraphs, drawEffectZones, drawDamageNumbers, drawCyberBeam, drawLastStandWarning, drawLaserSweep, loadGameAssets } from './canvasRenderer';
import Leaderboard from './Leaderboard';
import { generateUsername } from './usernameGenerator';
import BossHealthBar from './BossHealthBar';
import GameOverScreen from './GameOverScreen';

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
    boss: Boss | null;
    projectiles: Projectile[];
    powerUps: PowerUp[];
    animations: Animation[];
    telegraphs: Telegraph[];
    effectZones: EffectZone[];
    minions: Minion[];
    damageNumbers: DamageNumber[];
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
}

const initialPlayer: TankType = {
    id: 'player', name: 'Player', type: 'player', status: 'spawning', spawnTime: 0,
    position: { x: ARENA_WIDTH/2, y: ARENA_HEIGHT-100 }, velocity: {x:0, y:0},
    angle: -90, turretAngle: -90, size: {width:40, height:40}, 
    health: 10, maxHealth: 10, color: '#00E0FF', score: 0, kills: 0, deaths: 0,
    damageConverterCharge: 0
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
        boss: null,
        projectiles: [],
        powerUps: [],
        animations: [],
        telegraphs: [],
        effectZones: [],
        minions: [],
        damageNumbers: [],
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
        lastBossBeamTick: 0
    });

    const [uiState, setUiState] = useState<UIState>({
        playerHealth: 10, playerMaxHealth: 10, playerShield: 0, playerScore: 0, playerKills: 0,
        wave: 1, enemiesRemaining: 0, gameOver: false, duelWon: false, abilities: [], damageConverterCharge: 0
    });

    // --- HELPER FUNCTIONS ---
    const spawnPowerUp = (position: Vector) => {
        if (Math.random() > 0.50) return; // 50% chance

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
        tank.activePowerUp = type;
        tank.powerUpExpireTime = Date.now() + 15000; // 15s duration
        
        if (type === 'shield') tank.shieldHealth = 5;
        if (type === 'homingMissiles') tank.homingMissileCount = 10;
        
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
        e.status = 'dead';
        game.current.player.score += 50;
        setUiState(prev => ({...prev, playerScore: game.current.player.score}));
        
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
             } else if (characterId === 'iron-bastion') {
                 game.current.player.maxHealth = 25;
                 game.current.player.health = 25;
                 game.current.player.size = { width: 50, height: 50 };
                 game.current.player.tier = 'intermediate';
                 game.current.player.color = '#f97316';
             } else if (characterId === 'goliath-prime') {
                 game.current.player.maxHealth = 200;
                 game.current.player.health = 200;
                 game.current.player.size = { width: 100, height: 100 }; // Big!
                 game.current.player.bossType = 'goliath';
                 game.current.player.color = '#ef4444';
                 
                 // REPLACE ABILITIES WITH EXPANDED BOSS MOVESET
                 game.current.abilities = [
                     { id: 'shockwave', name: 'Shockwave', keyBinding: 'Q', state: 'ready', duration: 500, cooldown: 5000, startTime: 0 },
                     { id: 'railgun', name: 'Railgun', keyBinding: 'E', state: 'ready', duration: 500, cooldown: 8000, startTime: 0, chargeDuration: 1500 }, // Matches telegraph duration
                     { id: 'mortarVolley', name: 'Mortar Volley', keyBinding: 'R', state: 'ready', duration: 1000, cooldown: 10000, startTime: 0 },
                     { id: 'laserSweep', name: 'Laser Sweep', keyBinding: 'F', state: 'ready', duration: 8500, cooldown: 15000, startTime: 0 }, // Matched to boss nerf duration
                     { id: 'scatterMines', name: 'Scatter Mines', keyBinding: 'T', state: 'ready', duration: 500, cooldown: 12000, startTime: 0 },
                     { id: 'nanoSwarm', name: 'Nano Swarm', keyBinding: 'Y', state: 'ready', duration: 1500, cooldown: 14000, startTime: 0 }
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
            const { opponentType, tier, bossType, opponentName } = config.duelConfig;
            
            // Set Player to Active immediately for Duel
            game.current.player.status = 'active';
            
            if (opponentType === 'boss') {
                spawnBoss(bossType || 'goliath');
                if (game.current.boss) {
                    game.current.boss.status = 'active'; // Skip spawn anim
                    game.current.boss.spawnTime = 0;
                }
            } else {
                spawnDuelEnemy(opponentName, tier);
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

        // Normalization factor: target 60 FPS (16.67ms per frame)
        const timeScale = dt / 16.67; 

        // 0. State Transitions (Spawning -> Active)
        if (player.status === 'spawning' && player.spawnTime && now > player.spawnTime + SPAWN_DELAY) {
            player.status = 'active';
        }
        g.enemies.forEach(e => {
            if (e.status === 'spawning' && e.spawnTime && now > e.spawnTime + SPAWN_DELAY) {
                e.status = 'active';
            }
            // Regen powerup logic
            if (e.status === 'active' && e.activePowerUp === 'regensule' && e.health < e.maxHealth) {
                e.health = Math.min(e.maxHealth, e.health + (2 * dt) / 1000);
            }
        });
        if (g.boss && g.boss.status === 'spawning' && g.boss.spawnTime && now > g.boss.spawnTime + SPAWN_DELAY*2) {
            g.boss.status = 'active';
        }

        // Dynamic Music State Check
        if (g.boss) {
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
        if (player.activePowerUp && player.powerUpExpireTime && now > player.powerUpExpireTime) {
            player.activePowerUp = null;
            player.powerUpExpireTime = undefined;
            audio.play('uiBack'); // Power down sound
            player.shieldHealth = 0;
            player.homingMissileCount = 0;
        }

        // Player Passive Effects
        if (player.status === 'active' && player.activePowerUp === 'regensule' && player.health < player.maxHealth) {
             player.health = Math.min(player.maxHealth, player.health + (5 * dt) / 1000);
             setUiState(prev => ({...prev, playerHealth: player.health}));
        }

        // Check PowerUp Pickups
        game.current.powerUps = game.current.powerUps.filter(p => {
            const dist = Math.hypot(player.position.x - p.position.x, player.position.y - p.position.y);
            if (dist < player.size.width) {
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
            return true;
        });
        
        // --- PLAYER MINE DETECTION ---
        g.telegraphs = g.telegraphs.filter(t => {
            if (t.id.startsWith('mine-player-')) {
                const targets = [...g.enemies, g.boss].filter(tgt => tgt && tgt.status === 'active');
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
                                          audio.stopEngine('boss');
                                          setTimeout(() => { game.current.boss = null; }, 1000);
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
        g.projectiles = g.projectiles.filter(p => p.position.x > 0 && p.position.x < ARENA_WIDTH && p.position.y > 0 && p.position.y < ARENA_HEIGHT);

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
        g.enemies.forEach(e => updateEnemyAI(e, player, now, timeScale, diffConfig, () => {
            const angle = e.turretAngle;
            if (e.activePowerUp === 'homingMissiles' && (e.homingMissileCount || 0) > 0) {
                 fireMissile(e.id, false); 
                 e.homingMissileCount = (e.homingMissileCount || 0) - 1;
                 if (e.homingMissileCount <= 0) e.activePowerUp = null;
            } else if (e.activePowerUp === 'dualCannon') {
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
        
        if (g.projectiles.length > 200) g.projectiles = g.projectiles.slice(-200);
        if (g.animations.length > 100) g.animations = g.animations.slice(-100);
        if (g.damageNumbers.length > 50) g.damageNumbers = g.damageNumbers.slice(-50);

        if (g.enemies.length !== uiState.enemiesRemaining) {
             setUiState(prev => ({...prev, enemiesRemaining: g.enemies.length + (g.boss ? 1 : 0)}));
        }
    };
    
    const updateAbilities = (now: number, timeScale: number) => {
        const g = game.current;
        let stateChanged = false;
        
        const overdriveActive = g.abilities.find(a => a.id === 'overdrive')?.state === 'active';

        g.abilities = g.abilities.map(a => {
            let newState = a.state;
            let newStartTime = a.startTime;
            
            // BOSS ABILITIES (SANDBOX)
            if (a.id === 'laserSweep' && a.state === 'active') {
                 g.player.turretAngle += 0.706 * timeScale;
                 
                 if (now - g.lastBossBeamTick > 100) { 
                    g.lastBossBeamTick = now;
                    // Beam originates from tip: Goliath 65, Standard 30
                    const tipOffset = g.player.bossType === 'goliath' ? 65 : 30;
                    const firePos = getOffsetPoint(g.player.position, g.player.turretAngle, tipOffset, 0);
                    
                    const rad = g.player.turretAngle * (Math.PI/180); 
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
                            e.health -= 5;
                            e.lastHitTime = now;
                            g.damageNumbers.push({id: `sweep-${now}-${e.id}`, text: '5', position: e.position, createdAt: now, duration: 500, color: '#f00'});
                            if (e.health <= 0) handleEnemyDeath(e);
                        }
                    });
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
            // STANDARD ABILITIES
            else if (a.id === 'missileBarrage' && a.state === 'active') {
                const totalMissiles = overdriveActive ? 40 : 20;
                const interval = (a.duration || 1000) / totalMissiles;
                const elapsed = now - a.startTime;
                
                const shouldHaveFired = Math.min(totalMissiles, Math.floor(elapsed / interval));
                const firedSoFar = a.firedCount || 0;
                
                if (shouldHaveFired > firedSoFar) {
                    const count = shouldHaveFired - firedSoFar;
                    for(let i=0; i<count; i++) {
                         fireMissile('player', overdriveActive);
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
                const zapInterval = overdriveActive ? 250 : 500;
                const zapRange = 350;
                const damage = 5;
                
                if (now - (a.firedCount || 0) > zapInterval) {
                    const targets = g.enemies.filter(e => e.status === 'active' && Math.hypot(e.position.x - g.player.position.x, e.position.y - g.player.position.y) < zapRange);
                    if (g.boss && g.boss.status === 'active' && Math.hypot(g.boss.position.x - g.player.position.x, g.boss.position.y - g.player.position.y) < zapRange) {
                        targets.push(g.boss as any);
                    }
                    const zaps = targets.slice(0, 3);
                    
                    if (zaps.length > 0) {
                        a.firedCount = now;
                        audio.play('teslaZap');
                        zaps.forEach(target => {
                            target.health -= damage;
                            target.lastHitTime = now;
                            g.animations.push({
                                id: `lightning-${now}-${Math.random()}`, type: 'lightning', position: g.player.position, targetPosition: target.position, createdAt: now, duration: 300, color: '#00F0FF'
                            });
                            g.damageNumbers.push({
                                id: `dmg-tesla-${now}-${Math.random()}`, text: Math.round(damage).toString(), position: { x: target.position.x, y: target.position.y - 40 }, createdAt: now, duration: 600, color: '#00F0FF'
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
            else if ((a.id === 'cyberBeam' || a.id === 'railgun') && a.state === 'active') {
                if (now > a.startTime + (a.duration || 6000)) {
                    newState = 'cooldown';
                    newStartTime = now;
                    stateChanged = true;
                    if (a.id === 'cyberBeam') audio.stop('beamFire');
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
                    if (game.current.player.status === 'active') {
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
        if (player.bossType === 'goliath') {
             beamStart = getOffsetPoint(player.position, player.turretAngle, 65, 0);
        } else {
             beamStart = getOffsetPoint(player.position, player.turretAngle, 30, 0);
        }

        const dx = mouse.x - beamStart.x;
        const dy = mouse.y - beamStart.y;
        
        const overdriveActive = g.abilities.find(a => a.id === 'overdrive')?.state === 'active';
        const isRailgun = g.abilities.find(a => a.id === 'railgun')?.state === 'active';
        
        let damageMultiplier = overdriveActive ? 2.5 : 1.0;
        if (isRailgun) damageMultiplier *= 3.0;
        
        const beamLen = isRailgun ? 1200 : Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const endX = isRailgun ? beamStart.x + Math.cos(angle) * beamLen : mouse.x;
        const endY = isRailgun ? beamStart.y + Math.sin(angle) * beamLen : mouse.y;

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
            return dist < radius + (isRailgun ? 25 : 15);
        };

        let hit = false;
        
        g.enemies.forEach(e => {
            if (checkHit(e)) {
                const dmg = 1.5 * damageMultiplier;
                e.health -= dmg; 
                e.lastHitTime = now;
                hit = true;
                if (e.health <= 0) handleEnemyDeath(e);
                else {
                     g.damageNumbers.push({
                        id: `beam-${now}-${e.id}`, text: Math.round(dmg).toString(), 
                        position: {x: e.position.x + (Math.random()*10 - 5), y: e.position.y - 20}, 
                        createdAt: now, duration: 500, color: overdriveActive ? '#f59e0b' : '#00F0FF'
                    });
                }
            }
        });

        if (g.boss && checkHit(g.boss)) {
             const dmg = 1.5 * damageMultiplier;
             g.boss.health -= dmg; 
             g.boss.lastHitTime = now;
             hit = true;
             
             if (now % 200 < 50) {
                 g.damageNumbers.push({
                    id: `beam-boss-${now}`, text: Math.round(dmg).toString(), 
                    position: {x: g.boss.position.x + (Math.random()*20 - 10), y: g.boss.position.y - 30}, 
                    createdAt: now, duration: 500, color: overdriveActive ? '#f59e0b' : '#00F0FF'
                });
             }

             if (g.boss.health <= 0) {
                g.boss.status = 'dead';
                g.animations.push({ id: `b-die-${now}`, type: 'explosion', position: g.boss.position, createdAt: now, duration: 1000, color: 'red' });
                audio.play('bossExplosion');
                audio.stopEngine('boss');
                setTimeout(() => { game.current.boss = null; }, 1000);
            }
        }
        
        if (hit) g.screenShake = Math.max(g.screenShake, 2);
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

        const dx = player.position.x - boss.position.x;
        const dy = player.position.y - boss.position.y;
        const dist = Math.hypot(dx, dy);
        const targetAngle = Math.atan2(dy, dx) * (180/Math.PI);

        let angleDiff = targetAngle - boss.angle;
        while (angleDiff <= -180) angleDiff += 360;
        while (angleDiff > 180) angleDiff -= 360;
        boss.angle += angleDiff * 0.05 * timeScale;
        if (boss.attackState.currentAttack !== 'laserSweep' && boss.attackState.currentAttack !== 'railgun') {
             boss.turretAngle = boss.angle; 
        }

        const isStationaryAttack = boss.attackState.currentAttack === 'laserSweep' || boss.attackState.currentAttack === 'shockwave' || boss.attackState.currentAttack === 'railgun' || boss.attackState.phase === 'telegraphing';
        
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

        const isChanneling = boss.attackState.phase === 'attacking' && (boss.attackState.currentAttack === 'laserSweep' || boss.attackState.currentAttack === 'railgun');
        
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
            else if (dist > 550) { if (rand < 0.5) nextAttack = 'railgun'; else if (rand < 0.8) nextAttack = 'scatterMines'; else nextAttack = 'laserSweep'; } 
            else { if (rand < 0.3) nextAttack = 'mortarVolley'; else if (rand < 0.6) nextAttack = 'scatterMines'; else nextAttack = 'laserSweep'; }

            const targetPos = { ...player.position }; 
            const teleDur = (dur: number) => dur / diffConfig.bossAggression;

            if (nextAttack === 'shockwave') {
                boss.attackState = { currentAttack: nextAttack, phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: teleDur(1000), attackDuration: 500 } };
                audio.play('bossCharge', boss.position.x);
            } else if (nextAttack === 'railgun') {
                boss.attackState = { currentAttack: nextAttack, phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: teleDur(1500), attackDuration: 500, targetPosition: targetPos } };
                audio.play('bossRailgunCharge', boss.position.x);
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
            if (currentAttack === 'railgun') {
                if (progress < 0.8) {
                    const dx = player.position.x - boss.position.x; const dy = player.position.y - boss.position.y;
                    const angle = Math.atan2(dy, dx) * (180/Math.PI); boss.turretAngle = angle;
                    if (attackData) attackData.targetPosition = { ...player.position };
                }
            } else if (currentAttack === 'laserSweep') {
                const angleToPlayer = Math.atan2(player.position.y - boss.position.y, player.position.x - boss.position.x) * (180/Math.PI);
                let angleDiff = angleToPlayer - boss.angle; while (angleDiff <= -180) angleDiff += 360; while (angleDiff > 180) angleDiff -= 360;
                boss.angle += angleDiff * 0.05 * timeScale; boss.turretAngle = boss.angle;
                if (boss.attackState.attackData) { boss.attackState.attackData.sweepAngleStart = boss.angle; boss.attackState.attackData.sweepAngleEnd = boss.angle + 360; }
            }
            if (now > phaseStartTime + dur) {
                boss.attackState.phase = 'attacking'; boss.attackState.phaseStartTime = now;
                if (currentAttack === 'shockwave') {
                    audio.play('bossShockwave', boss.position.x); game.current.screenShake = 30;
                    game.current.animations.push({ id: `shock-${now}`, type: 'shockwave', position: boss.position, createdAt: now, duration: 600, width: 200 });
                    const pDist = Math.hypot(player.position.x - boss.position.x, player.position.y - boss.position.y);
                    if (pDist < 200) {
                        player.health -= 3; setUiState(prev => ({...prev, playerHealth: player.health}));
                        game.current.damageNumbers.push({id: `dmg-shock-${now}`, text: '3', position: {...player.position}, createdAt: now, duration: 1000, color: '#f00'});
                        const pushAngle = Math.atan2(player.position.y - boss.position.y, player.position.x - boss.position.x);
                        player.position.x += Math.cos(pushAngle) * 150; player.position.y += Math.sin(pushAngle) * 150;
                    }
                    setTimeout(() => { if (game.current.boss) { game.current.boss.attackState.phase = 'idle'; game.current.boss.attackState.phaseStartTime = Date.now(); } }, 500);
                } else if (currentAttack === 'railgun') {
                    audio.play('bossRailgunFire', boss.position.x); game.current.screenShake = 20;
                    const target = attackData?.targetPosition || player.position;
                    const firePos = getOffsetPoint(boss.position, boss.turretAngle, 65, 0);
                    game.current.animations.push({ id: `rail-${now}`, type: 'railgunBeam', position: firePos, targetPosition: target, createdAt: now, duration: 300 });
                    
                    const p = player.position; const a = firePos; const b = target;
                    const AB = Math.hypot(b.x - a.x, b.y - a.y);
                    const t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / (AB * AB);
                    const tClamped = Math.max(0, Math.min(1, t));
                    const projX = a.x + tClamped * (b.x - a.x);
                    const projY = a.y + tClamped * (b.y - a.y);
                    const distToImpact = Math.hypot(p.x - projX, p.y - projY);
                    
                    if (distToImpact < 40) {
                         player.health -= 4; setUiState(prev => ({...prev, playerHealth: player.health}));
                         game.current.damageNumbers.push({id: `dmg-rail-${now}`, text: '4', position: {...player.position}, createdAt: now, duration: 1000, color: '#f00'});
                         audio.play('hit');
                    }
                     setTimeout(() => { if (game.current.boss) { game.current.boss.attackState.phase = 'idle'; game.current.boss.attackState.phaseStartTime = Date.now(); } }, 500);
                } else if (currentAttack === 'mortarVolley') {
                    const ids = attackData?.telegraphIds || []; const activeTelegraphs = game.current.telegraphs.filter(t => ids.includes(t.id));
                    audio.play('bossMortarFire', boss.position.x); game.current.screenShake = Math.max(game.current.screenShake, 15);
                    activeTelegraphs.forEach(tele => {
                        game.current.animations.push({ id: `expl-${now}-${tele.id}`, type: 'mortarStrike', position: tele.position, createdAt: now, duration: 800 });
                        if (Math.hypot(player.position.x - tele.position.x, player.position.y - tele.position.y) < 80) {
                            player.health -= 3; player.lastHitTime = now; game.current.screenShake += 5; audio.play('hit');
                            setUiState(prev => ({...prev, playerHealth: player.health}));
                            game.current.damageNumbers.push({id: `dmg-p-${now}-${tele.id}`, text: '3', position: {...player.position}, createdAt: now, duration: 1000, color: '#f00'});
                        }
                    });
                    game.current.telegraphs = game.current.telegraphs.filter(t => !ids.includes(t.id));
                } else if (currentAttack === 'scatterMines') {
                    audio.play('bossMortarFire', boss.position.x); game.current.screenShake = Math.max(game.current.screenShake, 8);
                    const ids = attackData?.telegraphIds || []; const mineTelegraphs = game.current.telegraphs.filter(t => ids.includes(t.id));
                    mineTelegraphs.forEach((tele, i) => {
                        game.current.animations.push({ id: `mine-expl-${now}-${i}`, type: 'explosion', position: tele.position, createdAt: now + i*100, duration: 600, color: '#f97316' });
                        if (Math.hypot(player.position.x - tele.position.x, player.position.y - tele.position.y) < 60) {
                             player.health -= 2; player.lastHitTime = now; game.current.screenShake += 3;
                             setUiState(prev => ({...prev, playerHealth: player.health}));
                             game.current.damageNumbers.push({id: `dmg-p-${now}-${i}`, text: '2', position: {...player.position}, createdAt: now, duration: 1000, color: '#f00'});
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
                        player.health -= 1; player.lastHitTime = now; game.current.screenShake = 10; audio.play('impact_player', player.position.x);
                        setUiState(prev => ({...prev, playerHealth: player.health}));
                        game.current.damageNumbers.push({id: `dmg-laser-${now}`, text: '1', position: {...player.position}, createdAt: now, duration: 800, color: '#f00'});
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

                const applyHit = (target: TankType | Boss) => {
                    if ('activePowerUp' in target && target.activePowerUp === 'shield' && (target.shieldHealth || 0) > 0) {
                        target.shieldHealth = (target.shieldHealth || 0) - 1;
                        audio.play('shieldHit', target.position.x);
                        g.animations.push({ id: `shield-hit-${now}-${Math.random()}`, type: 'shieldHit', position: target.position, createdAt: now, duration: 300, color: '#06b6d4' });
                        if (target.shieldHealth <= 0) { target.activePowerUp = null; audio.play('shieldBreak', target.position.x); }
                        return;
                    }

                    target.health -= damage;
                    target.lastHitTime = now;
                    audio.play('impact_damage', target.position.x);
                    g.damageNumbers.push({ id: `dmg-${now}-${Math.random()}`, text: Math.round(damage).toString(), position: { x: target.position.x + (Math.random() * 40 - 20), y: target.position.y - 40 }, createdAt: now, duration: 800, color: p.color || '#ffffff' });

                    if (p.isVampiric && g.player.health < g.player.maxHealth) {
                         g.player.health = Math.min(g.player.maxHealth, g.player.health + 1);
                         setUiState(prev => ({...prev, playerHealth: g.player.health}));
                         g.animations.push({ id: `heal-${now}-${Math.random()}`, type: 'dashTrail', position: g.player.position, createdAt: now, duration: 300, color: '#22c55e' });
                    }

                    if (target.health <= 0) {
                        target.status = 'dead';
                        if ('type' in target && target.type === 'enemy') handleEnemyDeath(target);
                        else if ('bossType' in target) {
                             g.animations.push({ id: `b-die-${now}`, type: 'explosion', position: target.position, createdAt: now, duration: 1000, color: 'red' });
                             audio.play('bossExplosion');
                             audio.stopEngine('boss');
                             setTimeout(() => { game.current.boss = null; }, 1000);
                        }
                    }
                };

                if (g.boss && g.boss.status === 'active') {
                    if (Math.hypot(p.position.x - g.boss.position.x, p.position.y - g.boss.position.y) < g.boss.size.width/2) {
                        applyHit(g.boss);
                        hitSomething = true;
                    }
                }
                if (!hitSomething) {
                    for (const e of g.enemies) {
                         if (e.status !== 'active') continue;
                         if (Math.hypot(p.position.x - e.position.x, p.position.y - e.position.y) < 20) {
                             applyHit(e);
                             hitSomething = true;
                             break; 
                         }
                    }
                }

                if (hitSomething) {
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
                                      t.health -= splashDamage;
                                      t.lastHitTime = now;
                                      g.damageNumbers.push({id: `splash-${now}-${Math.random()}`, text: Math.round(splashDamage).toString(), position: t.position, createdAt: now, duration: 600, color: '#fca5a5'});
                                      if (t.health <= 0) {
                                          t.status = 'dead';
                                          if ('type' in t && t.type === 'enemy') handleEnemyDeath(t);
                                      }
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
                    g.player.health -= dmg;
                    g.player.lastHitTime = now;
                    p.damage = 0;
                    g.screenShake = 10;
                    audio.play('impact_player', g.player.position.x);
                    setUiState(prev => ({...prev, playerHealth: g.player.health}));
                    g.damageNumbers.push({ id: `dmg-p-${now}-${Math.random()}`, text: Math.round(dmg).toString(), position: { ...g.player.position, y: g.player.position.y - 30 }, createdAt: now, duration: 800, color: '#ff0000' });

                    const shooter = g.enemies.find(e => e.id === p.ownerId);
                    if (shooter && shooter.status === 'active' && shooter.activePowerUp === 'lifeLeech') {
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

    const fireMissile = (ownerId: string, isOverpowered: boolean = false) => {
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
        const damage = isOverpowered ? 4 : (isBoss ? 2 : 2);
        const radius = isOverpowered ? 60 : (isBoss ? 30 : 40);
        const color = isOverpowered ? '#fbbf24' : (isBoss ? '#a855f7' : '#ef4444');
        const turnRate = isBoss ? 3 : (ownerId === 'player' ? 8 : 4);

        const latOffset = Math.random() > 0.5 ? 13 : -13;
        // Pod Offset Forward: Player 6, Enemy 5
        const fwd = isBoss ? 0 : 6;
        const firePos = getOffsetPoint(source.position, source.turretAngle, fwd, latOffset);

        game.current.projectiles.push({
            id: `missile-${Date.now()}-${Math.random()}`, ownerId: ownerId, position: firePos, angle: angle, velocity: { x: Math.cos(rad) * speed, y: Math.sin(rad) * speed }, size: { width: 10, height: 6 }, damage: damage, blastRadius: radius, isHoming: true, turnRate: turnRate, targetId: targetId, color: color, createdAt: Date.now()
        });
        audio.play('rocketLaunch', source.position.x);
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
             if (game.current.player.activePowerUp === 'dualCannon') {
                 color = '#f97316'; damage += 1;
             }
             if (game.current.player.bossType === 'goliath') {
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
            if (game.current.player.activePowerUp === 'dualCannon' || game.current.player.bossType === 'goliath') audio.play('dualCannon', position.x);
            else audio.play(`shot_${Math.floor(Math.random() * 5) + 1}`, position.x);
        } else {
            audio.play('shot_5', position.x);
        }
    };

    const fireProjectile = (owner: TankType, angle: number) => {
        const isGoliath = owner.bossType === 'goliath' && owner.type === 'player';
        if (isGoliath) {
            fireProjectileAt(getOffsetPoint(owner.position, angle, 65, 12), angle, owner.id);
            fireProjectileAt(getOffsetPoint(owner.position, angle, 65, -12), angle, owner.id);
        } else if (owner.activePowerUp === 'dualCannon') {
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
            id: `e-${Date.now()}`, name: generateUsername(), type: 'enemy', status: 'spawning', spawnTime: Date.now(), position: { x, y: 50 }, velocity: {x:0,y:0}, angle: 90, turretAngle: 90, size: {width:40, height:40}, tier: tier, health: health, maxHealth: health, color: color, score: 0, kills: 0, deaths: 0, lastFireTime: 0, aiMode: 'engage', aiStrafeDir: Math.random() > 0.5 ? 1 : -1, aiStateTimer: Date.now() + Math.random() * 2000
        };

        if (Math.random() < 0.3) {
            const possiblePowerUps: PowerUpType[] = ['homingMissiles', 'shield', 'dualCannon', 'lifeLeech', 'regensule'];
            const type = possiblePowerUps[Math.floor(Math.random() * possiblePowerUps.length)];
            enemy.activePowerUp = type;
            if (type === 'homingMissiles') enemy.homingMissileCount = 10;
            if (type === 'shield') enemy.shieldHealth = 5;
        }

        game.current.enemies.push(enemy);
    };

    const spawnDuelEnemy = (name: string, tier: 'basic' | 'intermediate' | undefined) => {
        game.current.enemies.push({
            id: `duel-enemy`, name: name, type: 'enemy', status: 'active', spawnTime: 0, position: { x: ARENA_WIDTH / 2, y: 150 }, velocity: {x:0,y:0}, angle: 90, turretAngle: 90, size: {width: 50, height: 50}, tier: tier, health: tier === 'intermediate' ? 300 : 150, maxHealth: tier === 'intermediate' ? 300 : 150, color: tier === 'intermediate' ? '#f97316' : '#FF003C', score: 0, kills: 0, deaths: 0, lastFireTime: 0, aiMode: 'engage', aiStrafeDir: 1, aiStateTimer: 0
        });
    };

    const spawnBoss = (type: 'goliath' | 'viper' | 'sentinel') => {
        const hp = 1200 * diffConfig.bossHpMultiplier;
        game.current.boss = {
            id: 'boss', name: type.toUpperCase(), bossType: type, position: { x: ARENA_WIDTH/2, y: 150 }, velocity: {x:0,y:0}, angle: 90, turretAngle: 90, size: { width: 110, height: 110 }, health: hp, maxHealth: hp, color: '#ef4444', status: 'spawning', spawnTime: Date.now(), attackState: { currentAttack: 'none', phase: 'idle', phaseStartTime: Date.now() }
        };
        audio.play('bossSpawn');
    };

    // --- INPUT HANDLERS ---
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            game.current.keys[e.key.toLowerCase()] = true;
            if (game.current.player.status !== 'active') return;

            if (e.key.toLowerCase() === 'q') triggerAbility(game.current.abilities[0]?.id || 'overdrive');
            if (e.key.toLowerCase() === 'e') {
                const ab = game.current.abilities.find(a => a.id === 'cyberBeam' || a.id === 'railgun');
                if (ab && ab.state === 'ready') {
                    ab.state = 'charging';
                    ab.startTime = Date.now();
                    audio.start(ab.id === 'railgun' ? 'bossRailgunCharge' : 'beamCharge');
                    setUiState(prev => ({...prev, abilities: [...game.current.abilities]}));
                }
            }
            if (e.key.toLowerCase() === 'r') triggerAbility(game.current.abilities[2]?.id || 'damageConverter');
            if (e.key.toLowerCase() === 'f') triggerAbility(game.current.abilities[3]?.id || 'missileBarrage');
            if (e.key.toLowerCase() === 't') triggerAbility('scatterMines');
            if (e.key.toLowerCase() === 'y') triggerAbility(game.current.player.bossType === 'goliath' ? 'nanoSwarm' : 'teslaStorm');
            
            if ((e.key === ' ' || e.code === 'Space') && !e.repeat) fireProjectile(game.current.player, game.current.player.turretAngle);
        };
        
        const onKeyUp = (e: KeyboardEvent) => {
            game.current.keys[e.key.toLowerCase()] = false;
            if (e.key.toLowerCase() === 'e') {
                const ab = game.current.abilities.find(a => a.id === 'cyberBeam' || a.id === 'railgun');
                if (ab && ab.state === 'charging') {
                    const elapsed = Date.now() - (ab.startTime || 0);
                    const required = ab.chargeDuration || 1500;
                    if (elapsed >= required) { 
                        ab.state = 'active';
                        ab.startTime = Date.now();
                        if (ab.id === 'railgun') {
                             audio.stop('bossRailgunCharge');
                             audio.play('bossRailgunFire', game.current.player.position.x);
                             const firePos = game.current.player.bossType === 'goliath' ? getOffsetPoint(game.current.player.position, game.current.player.turretAngle, 65, 0) : game.current.player.position;
                             game.current.animations.push({ id: `rail-${Date.now()}`, type: 'railgunBeam', position: firePos, targetPosition: game.current.mouse, createdAt: Date.now(), duration: 300 });
                             ab.duration = 200; 
                        } else {
                             audio.stop('beamCharge');
                             audio.start('beamFire');
                        }
                    } else {
                        ab.state = 'ready';
                        audio.stop(ab.id === 'railgun' ? 'bossRailgunCharge' : 'beamCharge');
                    }
                    setUiState(prev => ({...prev, abilities: [...game.current.abilities]}));
                }
            }
        };
        const onMouseMove = (e: MouseEvent) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                const scaleX = canvasRef.current!.width / rect.width;
                const scaleY = canvasRef.current!.height / rect.height;
                game.current.mouse = { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
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
        const ab = game.current.abilities.find(a => a.id === id);
        if (ab && ab.state === 'ready') {
            ab.state = 'active';
            ab.startTime = Date.now();
            ab.firedCount = 0; 
            
            if (id === 'shockwave') {
                audio.play('bossShockwave');
                game.current.screenShake = 30;
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
                for(let i=0; i<12; i++) {
                    setTimeout(() => {
                        const angle = game.current.player.turretAngle + (Math.random() - 0.5) * 90; const rad = angle * (Math.PI/180);
                        game.current.projectiles.push({
                            id: `nano-${Date.now()}-${i}`, ownerId: 'player', position: { ...game.current.player.position }, angle: angle, velocity: { x: Math.cos(rad) * 12, y: Math.sin(rad) * 12 }, size: { width: 6, height: 6 }, damage: 1, isHoming: true, turnRate: 15, isVampiric: true, color: '#22c55e', createdAt: Date.now()
                        });
                    }, i * 50);
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
                const oldHp = game.current.player.health;
                game.current.player.health = Math.min(game.current.player.maxHealth, oldHp + 2);
                if (game.current.player.health > oldHp) {
                    game.current.damageNumbers.push({ id: `heal-${Date.now()}`, text: 'REPAIR', position: { ...game.current.player.position, y: game.current.player.position.y - 40 }, createdAt: Date.now(), duration: 1000, color: '#4ade80' });
                    setUiState(prev => ({...prev, playerHealth: game.current.player.health}));
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

        let shakeX = 0, shakeY = 0;
        if (g.screenShake > 0) {
            if (settings.screenShake) {
                shakeX = Math.random() * g.screenShake - g.screenShake / 2;
                shakeY = Math.random() * g.screenShake - g.screenShake / 2;
            }
            g.screenShake *= 0.9;
            if (g.screenShake < 0.5) g.screenShake = 0;
        }

        const isShaking = shakeX !== 0 || shakeY !== 0;
        if (isShaking) { ctx.save(); ctx.translate(shakeX, shakeY); }

        drawGrid(ctx, ARENA_WIDTH, ARENA_HEIGHT, 50);
        drawEffectZones(ctx, g.effectZones, now);
        drawTelegraphs(ctx, g.telegraphs, now);
        
        if (g.boss) { drawBoss(ctx, g.boss, now, false); drawLastStandWarning(ctx, g.boss, now); }
        g.enemies.forEach(e => drawTank(ctx, e, now, [], false));
        drawTank(ctx, g.player, now, g.abilities, false);
        
        const beamAbility = g.abilities.find(a => a.id === 'cyberBeam');
        const overdriveActive = g.abilities.find(a => a.id === 'overdrive')?.state === 'active';
        
        if (beamAbility && (beamAbility.state === 'charging' || beamAbility.state === 'active')) {
            drawCyberBeam(ctx, g.player, g.mouse, now, beamAbility.state, beamAbility.startTime || 0, beamAbility.chargeDuration, overdriveActive);
        }
        
        const railAbility = g.abilities.find(a => a.id === 'railgun');
        if (railAbility && (railAbility.state === 'charging')) {
             drawCyberBeam(ctx, g.player, g.mouse, now, 'charging', railAbility.startTime || 0, railAbility.chargeDuration, true);
        }

        const sweepAbility = g.abilities.find(a => a.id === 'laserSweep' && a.state === 'active');
        if (sweepAbility) {
            const firePos = g.player.bossType === 'goliath' ? getOffsetPoint(g.player.position, g.player.turretAngle, 65, 0) : g.player.position;
            drawLaserSweep(ctx, firePos, g.player.turretAngle, '#ef4444');
        }

        g.projectiles.forEach(p => drawProjectile(ctx, p, undefined, false));
        g.powerUps.forEach(p => drawPowerUp(ctx, p, now));
        drawAnimations(ctx, g.animations, now);
        drawDamageNumbers(ctx, g.damageNumbers, now);

        if (isShaking) ctx.restore();
    };

    return (
        <div className="relative w-full h-screen bg-[#111] overflow-hidden flex items-center justify-center cursor-none">
            <canvas ref={canvasRef} width={ARENA_WIDTH} height={ARENA_HEIGHT} className="bg-[#1a1a1a] shadow-2xl shadow-black border border-[#333]" />
            <HUD enemiesRemaining={uiState.enemiesRemaining} />
            <div className="absolute top-4 right-4 z-20">
                <Leaderboard player={{...game.current.player, score: uiState.playerScore}} enemies={game.current.enemies} boss={game.current.boss} />
            </div>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 h-[75%] w-80 z-20 pointer-events-none">
                <AbilityHotbar abilities={uiState.abilities.length ? uiState.abilities : game.current.abilities} damageConverterCharge={uiState.damageConverterCharge} /> 
            </div>
            {game.current.boss && <BossHealthBar boss={game.current.boss} />}
            {uiState.gameOver && (
                <GameOverScreen score={uiState.playerScore} kills={uiState.playerKills} onRestart={() => navigateTo('game')} onMainMenu={() => navigateTo('main-menu')} />
            )}
        </div>
    );
};

export default GameScreen;

function updateEnemyAI(e: TankType, player: TankType, now: number, timeScale: number, diffConfig: any, onFire: () => void): void {
    if (e.status !== 'active' || player.status !== 'active') return;

    const dist = Math.hypot(player.position.x - e.position.x, player.position.y - e.position.y);
    const angleToPlayer = Math.atan2(player.position.y - e.position.y, player.position.x - e.position.x) * (180/Math.PI);
    
    let angleDiff = angleToPlayer - e.turretAngle;
    while (angleDiff <= -180) angleDiff += 360;
    while (angleDiff > 180) angleDiff -= 360;
    e.turretAngle += angleDiff * (0.1 + diffConfig.aiTracking) * timeScale;
    
    if (now > (e.aiStateTimer || 0)) {
        e.aiStateTimer = now + 1000 + Math.random() * 2000;
        const rand = Math.random();
        if (dist > 400) e.aiMode = 'engage';
        else if (dist < 150) e.aiMode = 'flank';
        else e.aiMode = rand > 0.6 ? 'strafe' : 'engage';
        if (e.aiMode === 'strafe') e.aiStrafeDir = Math.random() > 0.5 ? 1 : -1;
    }

    const speed = (e.tier === 'intermediate' ? 1.5 : 2.0) * diffConfig.speedMultiplier * timeScale;
    let moveAngle = e.angle;
    let shouldMove = false;

    if (e.aiMode === 'engage') {
         if (dist > 250) { moveAngle = angleToPlayer; shouldMove = true; }
         else if (dist < 100) { moveAngle = angleToPlayer + 180; shouldMove = true; }
    } else if (e.aiMode === 'strafe') {
        moveAngle = angleToPlayer + 90 * (e.aiStrafeDir || 1); shouldMove = true;
    } else if (e.aiMode === 'flank') {
        moveAngle = angleToPlayer + 180 + (Math.random() - 0.5) * 60; shouldMove = true;
    }

    if (shouldMove) {
        let bodyDiff = moveAngle - e.angle;
        while (bodyDiff <= -180) bodyDiff += 360;
        while (bodyDiff > 180) bodyDiff -= 360;
        e.angle += bodyDiff * 0.05 * timeScale;

        const rad = e.angle * (Math.PI/180);
        const vx = Math.cos(rad) * speed;
        const vy = Math.sin(rad) * speed;
        e.position.x += vx; e.position.y += vy;
        e.velocity = {x: vx, y: vy};
        e.position.x = Math.max(40, Math.min(ARENA_WIDTH-40, e.position.x));
        e.position.y = Math.max(40, Math.min(ARENA_HEIGHT-40, e.position.y));
    } else {
        e.velocity = {x:0, y:0};
    }

    const fireRate = (e.tier === 'intermediate' ? 1200 : 2000) * diffConfig.fireRateMultiplier;
    if (now - (e.lastFireTime || 0) > fireRate) {
        if (Math.abs(angleDiff) < 30 && dist < 600) {
            e.lastFireTime = now;
            onFire();
        }
    }
}
