
import React, { useState, useEffect, useRef } from 'react';
import type { Screen, Ability, Tank as TankType, Projectile, Vector, Animation, PowerUp, Boss, Telegraph, EffectZone, GameConfig, UIState, Minion, DamageNumber } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { useAudio } from '../../contexts/AudioContext';

import HUD from './HUD';
import AbilityHotbar from './AbilityHotbar';
import { drawTank, drawProjectile, drawGrid, drawAnimations, drawPowerUp, drawBoss, drawTelegraphs, drawEffectZones, drawDamageNumbers, drawCyberBeam, drawLastStandWarning, degToRad } from './canvasRenderer';
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

const GameScreen: React.FC<{ navigateTo: (screen: Screen) => void, config: GameConfig }> = ({ navigateTo, config }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { settings } = useSettings();
    const audio = useAudio();
    
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
             { id: 'overdrive', name: 'Overdrive', keyBinding: 'Q', state: 'ready', duration: 8000, cooldown: 20000, startTime: 0 },
             { id: 'cyberBeam', name: 'Cyber Beam', keyBinding: 'E', state: 'ready', duration: 6000, cooldown: 12000, startTime: 0, chargeDuration: 1500 },
             { id: 'damageConverter', name: 'Flux Matrix', keyBinding: 'R', state: 'ready', duration: 6000, cooldown: 18000, startTime: 0 },
             { id: 'missileBarrage', name: 'Missile Barrage', keyBinding: 'F', state: 'ready', duration: 1000, cooldown: 15000, startTime: 0, firedCount: 0 },
             { id: 'timeStop', name: 'Time Stop', keyBinding: 'Y', state: 'ready', duration: 5000, cooldown: 30000, startTime: 0, chargeDuration: 2000, chargeStartTime: 0 },
        ],
        activeAbilityId: null,
        lastPowerUpTime: Date.now(),
        lastEnemySpawnTime: Date.now(),
        lastBeamTick: 0,
        lastBossBeamTick: 0
    });

    const [uiState, setUiState] = useState<UIState>({
        playerHealth: 10, playerMaxHealth: 10, playerShield: 0, playerScore: 0, playerKills: 0,
        wave: 1, enemiesRemaining: 0, gameOver: false, duelWon: false, abilities: []
    });

    // --- LOOP ---
    useEffect(() => {
        let rafId: number;
        
        // Reset state on mount
        game.current.lastTime = Date.now();
        game.current.player.spawnTime = Date.now();
        game.current.player.status = 'spawning';

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
            // Decay approx 5 charge per second
            player.damageConverterCharge = Math.max(0, player.damageConverterCharge - (dt / 1000) * 5);
        }

        // 1. Player Movement
        let playerSpeed = 0;
        if (player.status === 'active') {
            let dx = 0, dy = 0;
            // Case-insensitive key check
            if (g.keys['w'] || g.keys['arrowup']) dy -= 1;
            if (g.keys['s'] || g.keys['arrowdown']) dy += 1;
            if (g.keys['a'] || g.keys['arrowleft']) dx -= 1;
            if (g.keys['d'] || g.keys['arrowright']) dx += 1;

            if (dx !== 0 || dy !== 0) {
                const len = Math.hypot(dx, dy);
                dx /= len; dy /= len;
                // SPEED BUFF: Scaled by Overdrive
                const speed = PLAYER_SPEED * (g.abilities.find(a=>a.id==='overdrive')?.state === 'active' ? 1.5 : 1) * timeScale;
                player.position.x += dx * speed;
                player.position.y += dy * speed;
                player.velocity = { x: dx * speed, y: dy * speed }; // Store logic velocity
                playerSpeed = speed;
                player.angle = Math.atan2(dy, dx) * (180/Math.PI);
                
                // Boundaries
                player.position.x = Math.max(20, Math.min(ARENA_WIDTH-20, player.position.x));
                player.position.y = Math.max(20, Math.min(ARENA_HEIGHT-20, player.position.y));
            } else {
                player.velocity = {x: 0, y: 0};
            }
            // Fix: No offset needed, 0 degrees is Right, Math.atan2 returns 0 for Right
            player.turretAngle = Math.atan2(g.mouse.y - player.position.y, g.mouse.x - player.position.x) * (180/Math.PI);
        }

        // Update Player Engine Sound
        if (player.status === 'active') {
             audio.updateEngine('player', 'player', playerSpeed);
        }

        // 2. Abilities & Projectiles & Boss & AI
        updateAbilities(now);
        updateHomingProjectiles(dt, g.enemies, g.boss);
        
        g.projectiles.forEach(p => {
            // Apply timeScale to velocity
            p.position.x += p.velocity.x * timeScale;
            p.position.y += p.velocity.y * timeScale;
        });
        g.projectiles = g.projectiles.filter(p => p.position.x > 0 && p.position.x < ARENA_WIDTH && p.position.y > 0 && p.position.y < ARENA_HEIGHT);

        if (g.boss) {
            updateBoss(g.boss, player, now, timeScale);
            // Boss Engine Sound
            const bossSpeed = Math.hypot(g.boss.velocity.x, g.boss.velocity.y);
            audio.updateEngine('boss', 'boss', bossSpeed * 10); // Amplify for sound effect
        }
        
        // Spawn Enemies (CAMPAIGN MODE ONLY)
        if (config.mode === 'campaign') {
            if (!g.boss && g.enemies.length < 3 + g.wave && now - g.lastEnemySpawnTime > 3000) {
                spawnEnemy();
                g.lastEnemySpawnTime = now;
            }
            
            // Spawn Boss (CAMPAIGN MODE ONLY)
            if (!g.boss && player.score >= 500 && g.wave === 1) {
                spawnBoss('goliath');
                g.wave++;
            }
        }

        // AI Update
        g.enemies.forEach(e => updateEnemyAI(e, player, now, timeScale, () => {
            fireProjectileAt(e.position, e.turretAngle, e.id);
        }));
        
        // Manage Enemy Engine Sounds (Limit to closest 3 to prevent chaos)
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
        
        // Cleanup expired objects
        g.damageNumbers = g.damageNumbers.filter(d => now < d.createdAt + d.duration);
        // Important: Clean up old telegraphs to ensure visual sync, though Boss logic also handles explicit removal
        g.telegraphs = g.telegraphs.filter(t => now < t.createdAt + t.duration);

        // Sync vital stats for HUD
        if (g.enemies.length !== uiState.enemiesRemaining) {
             setUiState(prev => ({...prev, enemiesRemaining: g.enemies.length + (g.boss ? 1 : 0)}));
        }
    };
    
    const updateAbilities = (now: number) => {
        const g = game.current;
        let stateChanged = false;
        
        const overdriveActive = g.abilities.find(a => a.id === 'overdrive')?.state === 'active';

        g.abilities = g.abilities.map(a => {
            let newState = a.state;
            let newStartTime = a.startTime;
            
            // MISSILE BARRAGE
            if (a.id === 'missileBarrage' && a.state === 'active') {
                const totalMissiles = overdriveActive ? 40 : 20;
                const interval = a.duration / totalMissiles;
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

                if (elapsed > a.duration) {
                    newState = 'cooldown';
                    newStartTime = now;
                    stateChanged = true;
                    a.firedCount = 0; // Reset for next time
                }
            }
            // BEAM: Active Beam collision and logic
            else if (a.id === 'cyberBeam' && a.state === 'active') {
                if (now > a.startTime + a.duration) {
                    newState = 'cooldown';
                    newStartTime = now;
                    stateChanged = true;
                    audio.stop('beamFire');
                } else {
                    checkBeamCollision(now);
                }
            }
            else if (a.state === 'active' && now > a.startTime + a.duration) {
                if (a.id === 'overdrive') audio.stop('overdriveLoop');
                // Damage Converter cleanup (optional, charge decays naturally)
                newState = 'cooldown';
                newStartTime = now;
                stateChanged = true;
            }
            else if (a.state === 'cooldown' && now > a.startTime + a.cooldown) {
                newState = 'ready';
                stateChanged = true;
                // PLAY READY SOUND
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
                // Determine target based on projectile owner
                let targetPos: Vector | null = null;
                
                if (p.ownerId === 'player') {
                    // Player tracking Enemy/Boss
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
                    // Boss/Enemy tracking Player
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
                    if (Math.abs(angleDiff) < turnRate) {
                        p.angle = desiredAngle;
                    } else {
                        p.angle += Math.sign(angleDiff) * turnRate;
                    }

                    // Update velocity vector based on new angle
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
        if (now - g.lastBeamTick < 150) return; // Damage throttle
        g.lastBeamTick = now;

        const player = g.player;
        const mouse = g.mouse;
        const dx = mouse.x - player.position.x;
        const dy = mouse.y - player.position.y;
        
        const overdriveActive = g.abilities.find(a => a.id === 'overdrive')?.state === 'active';
        const damageMultiplier = overdriveActive ? 2.5 : 1.0;
        const beamLen = Math.hypot(dx, dy);
        const endX = mouse.x;
        const endY = mouse.y;

        const checkHit = (target: TankType | Boss) => {
            if (!target || target.status !== 'active') return false;
            
            const px = target.position.x;
            const py = target.position.y;
            const radius = target.size.width / 2;

            const l2 = beamLen * beamLen;
            if (l2 === 0) return false;
            
            const t = ((px - player.position.x) * (endX - player.position.x) + (py - player.position.y) * (endY - player.position.y)) / l2;
            const tClamped = Math.max(0, Math.min(1, t));
            
            const projX = player.position.x + tClamped * (endX - player.position.x);
            const projY = player.position.y + tClamped * (endY - player.position.y);
            
            const dist = Math.hypot(px - projX, py - projY);
            return dist < radius + 15; // +15 for beam width tolerance
        };

        let hit = false;
        
        // Damage Enemies
        g.enemies.forEach(e => {
            if (checkHit(e)) {
                const dmg = 1.5 * damageMultiplier;
                e.health -= dmg; 
                e.lastHitTime = now;
                hit = true;
                if (e.health <= 0) {
                    e.status = 'dead';
                    g.player.score += 50;
                    setUiState(prev => ({...prev, playerScore: g.player.score}));
                    audio.play('explosion', e.position.x);
                    g.animations.push({ id: `e-die-${now}-${Math.random()}`, type: 'explosion', position: e.position, createdAt: now, duration: 500, color: '#f97316' });
                    g.screenShake = Math.max(g.screenShake, 5);
                    audio.stopEngine(e.id);
                } else {
                     g.damageNumbers.push({
                        id: `beam-${now}-${e.id}`, text: Math.round(dmg).toString(), 
                        position: {x: e.position.x + (Math.random()*10 - 5), y: e.position.y - 20}, 
                        createdAt: now, duration: 500, color: overdriveActive ? '#f59e0b' : '#00F0FF'
                    });
                }
            }
        });

        // Damage Boss
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

        // --- SIMULTANEOUS ATTACKS (Passive Moves) ---
        // 1. Nova Burst (Randomly fires a ring of bullets)
        if (Math.random() < 0.005 * timeScale) { // ~Every 3-4s
            const count = 12;
            for(let i=0; i<count; i++) {
                const angle = (360 / count) * i + (now * 0.1); 
                fireProjectileAt(boss.position, angle, boss.id);
            }
            audio.play('shot_5', boss.position.x);
        }

        // 2. Homing Missile Launch (Randomly fires a tracking missile)
        if (Math.random() < 0.003 * timeScale) { // ~Every 5-6s
            fireMissile('boss', false);
        }

        // --- LAST STAND TRIGGER ---
        if (boss.health < boss.maxHealth * 0.20 && !boss.hasUsedLastStand) { 
            boss.hasUsedLastStand = true;
            boss.attackState = { 
                currentAttack: 'lastStand', 
                phase: 'charging', 
                phaseStartTime: now, 
                attackData: { attackDuration: 3000 } 
            };
            audio.start('bossCritical');
        }

        // --- LAST STAND LOGIC ---
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
                
                boss.attackState = { 
                    currentAttack: 'none', 
                    phase: 'recovering', 
                    phaseStartTime: now, 
                    attackData: { recoveryDuration: 2000 } 
                };
                
                audio.play('bossRecover');

                game.current.projectiles = game.current.projectiles.filter(p => {
                    const d = Math.hypot(p.position.x - boss.position.x, p.position.y - boss.position.y);
                    return d > maxRadius;
                });
                return;
            }
            return;
        }

        // --- MOVEMENT AI ---
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
            const speed = 1.0 * timeScale;
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

        // --- BASIC ATTACK (Now fires simultaneously with other phases except channeling) ---
        const isChanneling = boss.attackState.phase === 'attacking' && (boss.attackState.currentAttack === 'laserSweep' || boss.attackState.currentAttack === 'railgun');
        
        if (!isChanneling && (!boss.lastFireTime || now - boss.lastFireTime > 600)) {
            const rad = boss.turretAngle * (Math.PI/180);
            const perp = rad + Math.PI/2;
            const p1 = { x: boss.position.x + Math.cos(perp) * 10, y: boss.position.y + Math.sin(perp) * 10 };
            const p2 = { x: boss.position.x - Math.cos(perp) * 10, y: boss.position.y - Math.sin(perp) * 10 };
            fireProjectileAt(p1, boss.turretAngle, boss.id);
            fireProjectileAt(p2, boss.turretAngle, boss.id);
            boss.lastFireTime = now;
            audio.play('shot_2', boss.position.x);
        }
        
        // --- ATTACK STATE MACHINE ---
        const { currentAttack, phase, phaseStartTime, attackData } = boss.attackState;
        if (phase === 'idle' && now > phaseStartTime + 500) {
            const rand = Math.random();
            let nextAttack: typeof currentAttack = 'mortarVolley';
            if (dist < 200) { if (rand < 0.7) nextAttack = 'shockwave'; else nextAttack = 'mortarVolley'; }
            else if (dist > 550) { if (rand < 0.5) nextAttack = 'railgun'; else if (rand < 0.8) nextAttack = 'scatterMines'; else nextAttack = 'laserSweep'; } 
            else { if (rand < 0.3) nextAttack = 'mortarVolley'; else if (rand < 0.6) nextAttack = 'scatterMines'; else nextAttack = 'laserSweep'; }

            const targetPos = { ...player.position }; 
            if (nextAttack === 'shockwave') {
                boss.attackState = { currentAttack: nextAttack, phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: 1000, attackDuration: 500 } };
                audio.play('bossCharge', boss.position.x);
            } else if (nextAttack === 'railgun') {
                boss.attackState = { currentAttack: nextAttack, phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: 1500, attackDuration: 500, targetPosition: targetPos } };
                audio.play('bossRailgunCharge', boss.position.x);
            } else if (nextAttack === 'laserSweep') {
                // UPDATED: 360 Degree Sweep
                boss.attackState = { 
                    currentAttack: nextAttack, 
                    phase: 'telegraphing', 
                    phaseStartTime: now, 
                    attackData: { 
                        telegraphDuration: 1000, 
                        attackDuration: 6000, // Slower sweep for player evasion
                        sweepAngleStart: boss.angle, 
                        sweepAngleEnd: boss.angle + 360 
                    } 
                };
                audio.play('bossCharge', boss.position.x);
            } else if (nextAttack === 'scatterMines') {
                const count = 10 + Math.floor(Math.random() * 4);
                const telegraphIds: string[] = [];
                for(let i=0; i<count; i++) {
                    const id = `tele-mine-${now}-${i}`;
                    const angle = Math.random() * Math.PI * 2; const radius = 50 + Math.random() * 250;
                    const minePos = { x: Math.max(30, Math.min(ARENA_WIDTH-30, targetPos.x + Math.cos(angle)*radius)), y: Math.max(30, Math.min(ARENA_HEIGHT-30, targetPos.y + Math.sin(angle)*radius)) };
                    game.current.telegraphs.push({ id, type: 'circle', position: minePos, radius: 40, createdAt: now, duration: 1500, color: '#f97316' });
                    telegraphIds.push(id);
                }
                boss.attackState = { currentAttack: nextAttack, phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: 1500, telegraphIds: telegraphIds } };
                audio.play('bossWarning', boss.position.x);
            } else {
                const telegraphIds: string[] = [];
                const offsets = [{x:0, y:0}, {x: 60, y: 40}, {x: -60, y: 40}, {x: 60, y: -40}, {x: -60, y: -40}];
                offsets.forEach((off, i) => {
                    const id = `tele-mortar-${now}-${i}`; const pos = { x: targetPos.x + off.x, y: targetPos.y + off.y };
                    game.current.telegraphs.push({ id, type: 'circle', position: pos, radius: 80, createdAt: now, duration: 1500 });
                    telegraphIds.push(id);
                });
                boss.attackState = { currentAttack: nextAttack, phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: 1500, telegraphIds: telegraphIds, attackOrigin: targetPos } };
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
                    game.current.animations.push({ id: `rail-${now}`, type: 'railgunBeam', position: boss.position, targetPosition: target, createdAt: now, duration: 300 });
                    const p = player.position; const a = boss.position; const b = target;
                    const AB = Math.hypot(b.x - a.x, b.y - a.y);
                    const distToImpact = Math.hypot(p.x - b.x, p.y - b.y);
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
                } else if (currentAttack === 'laserSweep') { audio.start('beamFire'); }
            }
        } else if (phase === 'attacking') {
            if (currentAttack === 'laserSweep') {
                const dur = attackData?.attackDuration || 3000; const elapsed = now - phaseStartTime; const progress = elapsed / dur;
                if (progress > 1) { audio.stop('beamFire'); boss.attackState.phase = 'idle'; boss.attackState.phaseStartTime = now; return; }
                const start = attackData?.sweepAngleStart || 0; const end = attackData?.sweepAngleEnd || 0; const currentAngle = start + (end - start) * progress;
                boss.turretAngle = currentAngle;
                if (now - game.current.lastBossBeamTick > 100) { 
                    game.current.lastBossBeamTick = now;
                    const rad = currentAngle * (Math.PI/180); const beamLen = 900;
                    const p1 = boss.position; const p2 = { x: p1.x + Math.cos(rad) * beamLen, y: p1.y + Math.sin(rad) * beamLen };
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
        const player = g.player;

        g.projectiles.forEach(p => {
            if (p.ownerId === 'player') {
                const damage = p.damage || 1;
                let hitSomething = false;

                // Hit Function for AOE reuse
                const applyHit = (target: TankType | Boss) => {
                    target.health -= damage;
                    target.lastHitTime = now;
                    audio.play('impact_damage', target.position.x);
                    
                    g.damageNumbers.push({
                        id: `dmg-${now}-${Math.random()}`,
                        text: Math.round(damage).toString(),
                        position: { x: target.position.x + (Math.random() * 40 - 20), y: target.position.y - 40 },
                        createdAt: now,
                        duration: 800,
                        color: p.color || '#ffffff'
                    });

                    if (target.health <= 0) {
                        target.status = 'dead';
                        if ('type' in target && target.type === 'enemy') {
                            g.player.score += 50;
                            setUiState(prev => ({...prev, playerScore: g.player.score}));
                            audio.play('explosion', target.position.x);
                            g.animations.push({ id: `e-die-${now}-${Math.random()}`, type: 'explosion', position: target.position, createdAt: now, duration: 500, color: '#f97316' });
                            g.screenShake = Math.max(g.screenShake, 5);
                            audio.stopEngine(target.id);
                        } else if ('bossType' in target) {
                             g.animations.push({ id: `b-die-${now}`, type: 'explosion', position: target.position, createdAt: now, duration: 1000, color: 'red' });
                             audio.play('bossExplosion');
                             audio.stopEngine('boss');
                             setTimeout(() => { game.current.boss = null; }, 1000);
                        }
                    }
                };

                // Boss Collision
                if (g.boss && g.boss.status === 'active') {
                    const dist = Math.hypot(p.position.x - g.boss.position.x, p.position.y - g.boss.position.y);
                    if (dist < g.boss.size.width/2) {
                        applyHit(g.boss);
                        hitSomething = true;
                    }
                }
                
                // Enemy Collision
                if (!hitSomething) {
                    for (const e of g.enemies) {
                         if (e.status !== 'active') continue;
                         const dist = Math.hypot(p.position.x - e.position.x, p.position.y - e.position.y);
                         if (dist < 20) {
                             applyHit(e);
                             hitSomething = true;
                             break; 
                         }
                    }
                }

                if (hitSomething) {
                    // AOE Logic
                    if (p.blastRadius) {
                         audio.play('rocketExplosion', p.position.x);
                         g.animations.push({ 
                            id: `aoe-${now}-${Math.random()}`, 
                            type: 'explosion', 
                            position: p.position, 
                            createdAt: now, 
                            duration: 400, 
                            color: '#ef4444' 
                         });
                         
                         const targets = [...g.enemies, g.boss].filter(t => t && t.status === 'active');
                         
                         const splashDamage = p.damage || 2;
                         targets.forEach(t => {
                             if (!t) return;
                             const d = Math.hypot(t.position.x - p.position.x, t.position.y - p.position.y);
                             if (d < p.blastRadius!) {
                                 const isDirectHit = d < (('size' in t) ? t.size.width/2 : 20); 
                                 if (!isDirectHit) {
                                      t.health -= splashDamage;
                                      t.lastHitTime = now;
                                      g.damageNumbers.push({id: `splash-${now}-${Math.random()}`, text: Math.round(splashDamage).toString(), position: t.position, createdAt: now, duration: 600, color: '#fca5a5'});
                                      if (t.health <= 0) {
                                          t.status = 'dead';
                                          if ('type' in t && t.type === 'enemy') {
                                              g.player.score += 50;
                                              setUiState(prev => ({...prev, playerScore: g.player.score}));
                                              audio.stopEngine(t.id);
                                          }
                                      }
                                 }
                             }
                         });
                    }
                    p.damage = 0; // Destroy projectile
                }
            } else {
                if (g.player.status !== 'active') return;
                const dist = Math.hypot(p.position.x - g.player.position.x, p.position.y - g.player.position.y);
                if (dist < 20) {
                    const dmg = p.damage || 1;
                    g.player.health -= dmg;
                    g.player.lastHitTime = now;
                    p.damage = 0;
                    g.screenShake = 10;
                    audio.play('impact_player', g.player.position.x);
                    setUiState(prev => ({...prev, playerHealth: g.player.health}));
                    
                    g.damageNumbers.push({
                        id: `dmg-p-${now}-${Math.random()}`,
                        text: Math.round(dmg).toString(),
                        position: { ...g.player.position, y: g.player.position.y - 30 },
                        createdAt: now,
                        duration: 800,
                        color: '#ff0000'
                    });

                    // --- DAMAGE CONVERTER LOGIC ---
                    const damageConverter = g.abilities.find(a => a.id === 'damageConverter');
                    if (damageConverter && damageConverter.state === 'active') {
                        // Absorb damage into charge (Cap at 50)
                        const chargeGain = dmg * 5;
                        g.player.damageConverterCharge = Math.min(50, (g.player.damageConverterCharge || 0) + chargeGain);
                        
                        // Visual feedback for charge gain
                        g.damageNumbers.push({
                            id: `charge-${now}-${Math.random()}`,
                            text: '+CHARGE',
                            position: { x: g.player.position.x, y: g.player.position.y + 30 },
                            createdAt: now,
                            duration: 600,
                            color: '#8b5cf6'
                        });
                        audio.play('uiToggle'); // Slight electronic sound
                    }
                }
            }
        });
        g.projectiles = g.projectiles.filter(p => (p.damage === undefined || p.damage > 0));
        g.enemies = g.enemies.filter(e => e.status !== 'dead');
    };

    const fireMissile = (ownerId: string, isOverpowered: boolean = false) => {
        const g = game.current;
        const source = ownerId === 'player' ? g.player : g.boss;
        if (!source || source.status !== 'active') return;

        let targetId = undefined;
        let minD = 9999;
        
        if (ownerId === 'player') {
            // Player tracking Boss/Enemy
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
            // Boss tracking Player
            if (g.player.status === 'active') {
                targetId = g.player.id;
            }
        }

        const spread = (Math.random() - 0.5) * 60;
        const angle = source.turretAngle + spread;
        const rad = angle * (Math.PI/180);
        
        const speed = MISSILE_SPEED * (isOverpowered ? 1.5 : 1);
        const damage = isOverpowered ? 4 : (ownerId === 'boss' ? 2 : 2);
        const radius = isOverpowered ? 60 : (ownerId === 'boss' ? 30 : 40);
        const color = isOverpowered ? '#fbbf24' : (ownerId === 'boss' ? '#a855f7' : '#ef4444');

        game.current.projectiles.push({
            id: `missile-${Date.now()}-${Math.random()}`,
            ownerId: ownerId,
            position: { ...source.position },
            angle: angle,
            velocity: { x: Math.cos(rad) * speed, y: Math.sin(rad) * speed },
            size: { width: 10, height: 6 },
            damage: damage,
            blastRadius: radius,
            isHoming: true,
            turnRate: 8,
            targetId: targetId,
            color: color
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
                 damage = 4;
                 speed *= 1.2;
                 color = '#fbbf24';
             }
             
             // FLUX MATRIX BONUS
             // If damage converter has charge, expend some of it to boost damage
             const charge = game.current.player.damageConverterCharge || 0;
             if (charge > 0) {
                 const bonus = charge * 0.2; // 20% of charge as damage
                 damage += bonus;
                 // Change color to violet to indicate charged shot
                 color = '#8b5cf6';
                 // Optionally consume a little charge on fire, or just let it decay?
                 // Prompt implies "output increased by this energy", let's consume a bit on fire for 'momentary' feel
                 game.current.player.damageConverterCharge = Math.max(0, charge - 2); 
             }
        } else if (ownerId === 'boss') {
             damage = 2;
             speed *= 1.15;
             color = '#ef4444';
        }

        game.current.projectiles.push({
            id: `p-${Date.now()}-${Math.random()}`,
            ownerId: ownerId,
            position: { ...position },
            angle: angle,
            velocity: { x: Math.cos(rad)*speed, y: Math.sin(rad)*speed },
            size: { width: 8, height: 8 },
            damage: damage,
            color: color
        });
        
        if (ownerId === 'player') {
            const variant = Math.floor(Math.random() * 5) + 1;
            audio.play(`shot_${variant}`, position.x);
        } else {
            audio.play('shot_5', position.x);
        }
    };

    // Helper for simple firing from center
    const fireProjectile = (owner: TankType, angle: number) => {
        fireProjectileAt(owner.position, angle, owner.id);
    }

    const spawnEnemy = () => {
        const x = Math.random() * (ARENA_WIDTH - 100) + 50;
        const tier = Math.random() > 0.7 ? 'intermediate' : 'basic';
        const color = tier === 'intermediate' ? '#f97316' : '#FF003C';
        
        game.current.enemies.push({
            id: `e-${Date.now()}`, 
            name: generateUsername(), 
            type: 'enemy', 
            status: 'spawning', 
            spawnTime: Date.now(),
            position: { x, y: 50 }, 
            velocity: {x:0,y:0}, 
            angle: 90, 
            turretAngle: 90,
            size: {width:40, height:40}, 
            tier: tier,
            health: tier === 'intermediate' ? 30 : 15, 
            maxHealth: tier === 'intermediate' ? 30 : 15, 
            color: color, 
            score: 0, 
            kills: 0, 
            deaths: 0,
            lastFireTime: 0,
            aiMode: 'engage',
            aiStrafeDir: Math.random() > 0.5 ? 1 : -1,
            aiStateTimer: Date.now() + Math.random() * 2000
        });
    };

    const spawnDuelEnemy = (name: string, tier: 'basic' | 'intermediate' | undefined) => {
        const x = ARENA_WIDTH / 2;
        const y = 150;
        const color = tier === 'intermediate' ? '#f97316' : '#FF003C';
        
        game.current.enemies.push({
            id: `duel-enemy`, 
            name: name, 
            type: 'enemy', 
            status: 'active', // Immediate active
            spawnTime: 0,
            position: { x, y }, 
            velocity: {x:0,y:0}, 
            angle: 90, 
            turretAngle: 90,
            size: {width: 50, height: 50}, 
            tier: tier,
            health: tier === 'intermediate' ? 300 : 150, 
            maxHealth: tier === 'intermediate' ? 300 : 150, 
            color: color, 
            score: 0, kills: 0, deaths: 0,
            lastFireTime: 0, aiMode: 'engage', aiStrafeDir: 1, aiStateTimer: 0
        });
    };

    const spawnBoss = (type: 'goliath' | 'viper' | 'sentinel') => {
        game.current.boss = {
            id: 'boss', name: type.toUpperCase(), bossType: type,
            position: { x: ARENA_WIDTH/2, y: 150 }, velocity: {x:0,y:0}, 
            angle: 90, 
            turretAngle: 90,
            size: { width: 110, height: 110 }, health: 1200, maxHealth: 1200, color: '#ef4444',
            status: 'spawning', spawnTime: Date.now(),
            attackState: { currentAttack: 'none', phase: 'idle', phaseStartTime: Date.now() }
        };
        audio.play('bossSpawn');
    };

    // --- INPUT HANDLERS ---
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            game.current.keys[e.key.toLowerCase()] = true;
            if (game.current.player.status !== 'active') return;

            if (e.key.toLowerCase() === 'q') triggerAbility('overdrive');
            if (e.key.toLowerCase() === 'f') triggerAbility('missileBarrage');
            if (e.key.toLowerCase() === 'y') triggerAbility('timeStop');
            if (e.key.toLowerCase() === 'r') triggerAbility('damageConverter'); // New Keybind
            if ((e.key === ' ' || e.code === 'Space') && !e.repeat) fireProjectile(game.current.player, game.current.player.turretAngle);

            if (e.key.toLowerCase() === 'e') {
                const ab = game.current.abilities.find(a => a.id === 'cyberBeam');
                if (ab && ab.state === 'ready') {
                    ab.state = 'charging';
                    ab.startTime = Date.now();
                    audio.start('beamCharge');
                    setUiState(prev => ({...prev, abilities: [...game.current.abilities]}));
                }
            }
        };
        
        const onKeyUp = (e: KeyboardEvent) => {
            game.current.keys[e.key.toLowerCase()] = false;

            if (e.key.toLowerCase() === 'e') {
                const ab = game.current.abilities.find(a => a.id === 'cyberBeam');
                if (ab && ab.state === 'charging') {
                    const elapsed = Date.now() - ab.startTime;
                    if (elapsed >= (ab.chargeDuration || 1500)) { 
                        ab.state = 'active';
                        ab.startTime = Date.now();
                        audio.stop('beamCharge');
                        audio.start('beamFire');
                    } else {
                        ab.state = 'ready';
                        audio.stop('beamCharge');
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
                game.current.mouse = { 
                    x: (e.clientX - rect.left) * scaleX, 
                    y: (e.clientY - rect.top) * scaleY 
                };
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
            ab.firedCount = 0; // Reset for missile barrage
            
            if (id === 'overdrive') {
                audio.play('overdrive');
                audio.start('overdriveLoop');
            } else if (id === 'missileBarrage') {
                audio.play('abilityReady'); // Or a launch sound
            } else if (id === 'timeStop') {
                audio.play('chronoActive');
                // Synergy: Temporal Sunder if Overdrive is active
                const overdrive = game.current.abilities.find(a => a.id === 'overdrive');
                if (overdrive && overdrive.state === 'active') {
                    game.current.enemies.forEach(e => {
                        if (e.status === 'active') {
                            e.health -= 10;
                            game.current.damageNumbers.push({
                                id: `sunder-${Date.now()}-${e.id}`,
                                text: '10',
                                position: { x: e.position.x, y: e.position.y - 30 },
                                createdAt: Date.now(),
                                duration: 800,
                                color: '#f59e0b'
                            });
                        }
                    });
                    game.current.screenShake = Math.max(game.current.screenShake, 15);
                }
            } else if (id === 'damageConverter') {
                audio.play('shieldHit'); // Placeholder sound
            } else {
                audio.play('uiClick');
            }
            
            if (id === 'overdrive') {
                const heal = 2;
                const oldHp = game.current.player.health;
                game.current.player.health = Math.min(game.current.player.maxHealth, oldHp + heal);
                
                if (game.current.player.health > oldHp) {
                    game.current.damageNumbers.push({
                        id: `heal-${Date.now()}`,
                        text: 'REPAIR',
                        position: { ...game.current.player.position, y: game.current.player.position.y - 40 },
                        createdAt: Date.now(),
                        duration: 1000,
                        color: '#4ade80'
                    });
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

        let shakeX = 0;
        let shakeY = 0;
        
        if (g.screenShake > 0) {
            if (settings.screenShake) {
                shakeX = Math.random() * g.screenShake - g.screenShake / 2;
                shakeY = Math.random() * g.screenShake - g.screenShake / 2;
            }
            g.screenShake *= 0.9;
            if (g.screenShake < 0.5) g.screenShake = 0;
        }

        const isShaking = shakeX !== 0 || shakeY !== 0;

        if (isShaking) {
            ctx.save();
            ctx.translate(shakeX, shakeY);
        }

        drawGrid(ctx, ARENA_WIDTH, ARENA_HEIGHT, 50);
        drawEffectZones(ctx, g.effectZones, now);
        drawTelegraphs(ctx, g.telegraphs, now);
        
        if (g.boss) {
             drawBoss(ctx, g.boss, now, false);
             drawLastStandWarning(ctx, g.boss, now);
        }
        
        g.enemies.forEach(e => drawTank(ctx, e, now, [], false));
        drawTank(ctx, g.player, now, g.abilities, false);
        
        const beamAbility = g.abilities.find(a => a.id === 'cyberBeam');
        const overdriveActive = g.abilities.find(a => a.id === 'overdrive')?.state === 'active';
        
        if (beamAbility && (beamAbility.state === 'charging' || beamAbility.state === 'active')) {
            drawCyberBeam(ctx, g.player, g.mouse, now, beamAbility.state, beamAbility.startTime, beamAbility.chargeDuration, overdriveActive);
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
                <Leaderboard 
                    player={{...game.current.player, score: uiState.playerScore}} 
                    enemies={game.current.enemies}
                    boss={game.current.boss} 
                />
            </div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[60%] w-64 z-20">
                <AbilityHotbar abilities={uiState.abilities.length ? uiState.abilities : game.current.abilities} /> 
            </div>
            {game.current.boss && <BossHealthBar boss={game.current.boss} />}
            {uiState.gameOver && (
                <GameOverScreen 
                    score={uiState.playerScore} 
                    kills={uiState.playerKills} 
                    onRestart={() => navigateTo('game')} 
                    onMainMenu={() => navigateTo('main-menu')} 
                />
            )}
        </div>
    );
};

export default GameScreen;

function updateEnemyAI(e: TankType, player: TankType, now: number, timeScale: number, onFire: () => void): void {
    // Basic AI Implementation
    if (e.status !== 'active' || player.status !== 'active') return;

    const dist = Math.hypot(player.position.x - e.position.x, player.position.y - e.position.y);
    const angleToPlayer = Math.atan2(player.position.y - e.position.y, player.position.x - e.position.x) * (180/Math.PI);
    
    // Smooth Turret Rotation
    let angleDiff = angleToPlayer - e.turretAngle;
    while (angleDiff <= -180) angleDiff += 360;
    while (angleDiff > 180) angleDiff -= 360;
    e.turretAngle += angleDiff * 0.1 * timeScale;
    
    // State Switching
    if (now > (e.aiStateTimer || 0)) {
        e.aiStateTimer = now + 1000 + Math.random() * 2000;
        const rand = Math.random();
        if (dist > 400) e.aiMode = 'engage';
        else if (dist < 150) e.aiMode = 'flank';
        else e.aiMode = rand > 0.6 ? 'strafe' : 'engage';
        
        if (e.aiMode === 'strafe') e.aiStrafeDir = Math.random() > 0.5 ? 1 : -1;
    }

    // Movement
    const speed = (e.tier === 'intermediate' ? 1.5 : 2.0) * timeScale;
    let moveAngle = e.angle;
    let shouldMove = false;

    if (e.aiMode === 'engage') {
         // Move towards player, but maintain distance
         if (dist > 250) {
             moveAngle = angleToPlayer;
             shouldMove = true;
         } else if (dist < 100) {
             moveAngle = angleToPlayer + 180;
             shouldMove = true;
         }
    } else if (e.aiMode === 'strafe') {
        moveAngle = angleToPlayer + 90 * (e.aiStrafeDir || 1);
        shouldMove = true;
    } else if (e.aiMode === 'flank') {
        moveAngle = angleToPlayer + 180 + (Math.random() - 0.5) * 60;
        shouldMove = true;
    }

    if (shouldMove) {
        // Smooth body rotation towards movement direction
        let bodyDiff = moveAngle - e.angle;
        while (bodyDiff <= -180) bodyDiff += 360;
        while (bodyDiff > 180) bodyDiff -= 360;
        e.angle += bodyDiff * 0.05 * timeScale;

        const rad = e.angle * (Math.PI/180);
        const vx = Math.cos(rad) * speed;
        const vy = Math.sin(rad) * speed;
        
        e.position.x += vx;
        e.position.y += vy;
        e.velocity = {x: vx, y: vy};
        
        // Bounds
        e.position.x = Math.max(40, Math.min(ARENA_WIDTH-40, e.position.x));
        e.position.y = Math.max(40, Math.min(ARENA_HEIGHT-40, e.position.y));
    } else {
        e.velocity = {x:0, y:0};
    }

    // Firing Logic
    const fireRate = e.tier === 'intermediate' ? 1200 : 2000;
    if (now - (e.lastFireTime || 0) > fireRate) {
        // Only fire if reasonably aiming at player
        if (Math.abs(angleDiff) < 30 && dist < 600) {
            e.lastFireTime = now;
            onFire(); // Calls back to main loop to spawn projectile
        }
    }
}
