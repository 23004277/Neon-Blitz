
import React, { useState, useEffect, useRef } from 'react';
import type { Screen, Ability, Tank as TankType, Projectile, Vector, Animation, PowerUp, Boss, Telegraph, EffectZone, GameConfig, UIState, Minion, DamageNumber } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { useAudio } from '../../contexts/AudioContext';

import HUD from './HUD';
import AbilityHotbar from './AbilityHotbar';
import { drawTank, drawProjectile, drawGrid, drawAnimations, drawPowerUp, drawBoss, drawTelegraphs, drawEffectZones } from './canvasRenderer';
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
}

const initialPlayer: TankType = {
    id: 'player', name: 'Player', type: 'player', status: 'spawning', spawnTime: 0,
    position: { x: ARENA_WIDTH/2, y: ARENA_HEIGHT-100 }, velocity: {x:0, y:0},
    angle: -90, turretAngle: -90, size: {width:40, height:40}, 
    health: 10, maxHealth: 10, color: '#00E0FF', score: 0, kills: 0, deaths: 0
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
             { id: 'cyberBeam', name: 'Cyber Beam', keyBinding: 'E', state: 'ready', duration: 4000, cooldown: 10000, startTime: 0 },
             { id: 'chronoBubble', name: 'Chrono Bubble', keyBinding: 'F', state: 'ready', duration: 8000, cooldown: 25000, startTime: 0 },
             { id: 'timeStop', name: 'Time Stop', keyBinding: 'Y', state: 'ready', duration: 5000, cooldown: 30000, startTime: 0, chargeDuration: 2000, chargeStartTime: 0 },
        ],
        activeAbilityId: null,
        lastPowerUpTime: Date.now(),
        lastEnemySpawnTime: Date.now()
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
                }
            } else {
                rafId = requestAnimationFrame(loop);
            }
        };

        rafId = requestAnimationFrame(loop);
        
        // Initial Music State
        audio.startMusic();
        audio.setMusicState('ambient');

        return () => {
            cancelAnimationFrame(rafId);
            audio.stopMusic();
        };
    }, []);

    // --- UPDATE LOGIC ---
    const update = (dt: number) => {
        const now = Date.now();
        const g = game.current;
        const player = g.player;

        // Normalization factor: target 60 FPS (16.67ms per frame)
        // If running at 144Hz (approx 7ms), scale will be ~0.42, slowing down per-frame movement to match 60Hz speed.
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

        // 1. Player Movement
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
                const speed = PLAYER_SPEED * (g.abilities.find(a=>a.id==='overdrive')?.state === 'active' ? 1.5 : 1) * timeScale;
                player.position.x += dx * speed;
                player.position.y += dy * speed;
                player.angle = Math.atan2(dy, dx) * (180/Math.PI);
                
                // Boundaries
                player.position.x = Math.max(20, Math.min(ARENA_WIDTH-20, player.position.x));
                player.position.y = Math.max(20, Math.min(ARENA_HEIGHT-20, player.position.y));
            }
            // Fix: No offset needed, 0 degrees is Right, Math.atan2 returns 0 for Right
            player.turretAngle = Math.atan2(g.mouse.y - player.position.y, g.mouse.x - player.position.x) * (180/Math.PI);
        }

        // 2. Abilities & Projectiles & Boss & AI
        updateAbilities(now);
        
        g.projectiles.forEach(p => {
            // Apply timeScale to velocity
            // Since we stored velocity as per-frame pixels (at 60fps assumption), we scale the addition
            p.position.x += p.velocity.x * timeScale;
            p.position.y += p.velocity.y * timeScale;
        });
        g.projectiles = g.projectiles.filter(p => p.position.x > 0 && p.position.x < ARENA_WIDTH && p.position.y > 0 && p.position.y < ARENA_HEIGHT);

        if (g.boss) updateBoss(g.boss, player, now);
        
        // Spawn Enemies
        if (!g.boss && g.enemies.length < 3 + g.wave && now - g.lastEnemySpawnTime > 3000) {
            spawnEnemy();
            g.lastEnemySpawnTime = now;
        }
        
        // Spawn Boss
        if (!g.boss && player.score >= 500 && g.wave === 1) {
            spawnBoss('goliath');
            g.wave++;
        }

        g.enemies.forEach(e => updateEnemyAI(e, player, now, timeScale));
        checkCollisions(now);
        
        // Sync vital stats for HUD
        if (g.enemies.length !== uiState.enemiesRemaining) {
             setUiState(prev => ({...prev, enemiesRemaining: g.enemies.length + (g.boss ? 1 : 0)}));
        }
    };
    
    const updateAbilities = (now: number) => {
        const g = game.current;
        let stateChanged = false;
        
        g.abilities = g.abilities.map(a => {
            let newState = a.state;
            let newStartTime = a.startTime;
            
            if (a.state === 'active' && now > a.startTime + a.duration) {
                newState = 'cooldown';
                newStartTime = now;
                stateChanged = true;
            }
            else if (a.state === 'cooldown' && now > a.startTime + a.cooldown) {
                newState = 'ready';
                stateChanged = true;
            }
            else if (a.id === 'cyberBeam' && a.state === 'charging' && now > a.startTime + 2000) {
                newState = 'active';
                newStartTime = now;
                stateChanged = true;
            }
            
            return { ...a, state: newState, startTime: newStartTime };
        });

        // Only trigger React render if visual state changed
        if (stateChanged) {
             setUiState(prev => ({...prev, abilities: [...g.abilities]}));
        }
    };

    const updateBoss = (boss: Boss, player: TankType, now: number) => {
        if (boss.status !== 'active') return;
        
        if (boss.health < boss.maxHealth * 0.3 && !boss.hasUsedLastStand) {
            boss.hasUsedLastStand = true;
            boss.attackState = { currentAttack: 'lastStand', phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: 2000 } };
            audio.play('bossWarning');
        }
        const { currentAttack, phase, phaseStartTime, attackData } = boss.attackState;
        
        if (phase === 'idle' && now > phaseStartTime + 2000) {
            const next = 'mortarVolley'; 
            boss.attackState = { currentAttack: next, phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: 1500 } };
            game.current.telegraphs.push({ id: `tele-${now}`, type: 'circle', position: player.position, radius: 60, createdAt: now, duration: 1500 });
        } 
        else if (phase === 'telegraphing') {
            if (now > phaseStartTime + (attackData?.telegraphDuration || 1000)) {
                boss.attackState.phase = 'attacking';
                boss.attackState.phaseStartTime = now;
                if (currentAttack === 'mortarVolley') {
                    audio.play('explosion', player.position.x); 
                    game.current.animations.push({ id: `expl-${now}`, type: 'mortarStrike', position: player.position, createdAt: now, duration: 800 });
                }
            }
        }
        else if (phase === 'attacking' && now > phaseStartTime + 1000) {
            boss.attackState.phase = 'idle';
            boss.attackState.phaseStartTime = now;
        }
    };

    const updateEnemyAI = (e: TankType, player: TankType, now: number, timeScale: number) => {
        if (e.status !== 'active') return;
        const dx = player.position.x - e.position.x;
        const dy = player.position.y - e.position.y;
        const dist = Math.hypot(dx, dy);
        
        // Simple chase logic scaled by dt
        if (dist > 150) { 
            // Enemy speed slightly slower than player
            const moveAmt = 2.0 * timeScale;
            e.position.x += (dx/dist) * moveAmt; 
            e.position.y += (dy/dist) * moveAmt; 
        }
        // Fix: Remove 90 degree offset. 0 degrees = Right (standard)
        e.angle = Math.atan2(dy, dx) * (180/Math.PI);
        
        // Fire if looking roughly at player
        // Reduced fire probability slightly as checks happen more often on high refresh if not careful, 
        // but here it is per-frame check. We should ideally use a timer.
        // Keeping random for now but ensuring it's fair.
        if (dist < 400 && Math.random() < (0.02 * timeScale)) { // Scale probability by timeScale to maintain fire rate
            fireProjectile(e, e.angle);
        }
    };

    const checkCollisions = (now: number) => {
        const g = game.current;
        g.projectiles.forEach(p => {
            if (p.ownerId === 'player') {
                if (g.boss && g.boss.status === 'active') {
                    const dist = Math.hypot(p.position.x - g.boss.position.x, p.position.y - g.boss.position.y);
                    if (dist < g.boss.size.width/2) {
                        g.boss.health -= 1;
                        g.boss.lastHitTime = now;
                        audio.play('hit', g.boss.position.x);
                        p.damage = 0;
                        if (g.boss.health <= 0) {
                            g.boss.status = 'dead';
                            g.animations.push({ id: `b-die-${now}`, type: 'explosion', position: g.boss.position, createdAt: now, duration: 1000, color: 'red' });
                            audio.play('bossExplosion');
                            setTimeout(() => { game.current.boss = null; }, 1000);
                        }
                    }
                }
                g.enemies.forEach(e => {
                    if (e.status !== 'active') return;
                    const dist = Math.hypot(p.position.x - e.position.x, p.position.y - e.position.y);
                    if (dist < 20) {
                        e.health -= 2;
                        e.lastHitTime = now;
                        p.damage = 0;
                        if (e.health <= 0) {
                            e.status = 'dead';
                            g.player.score += 50;
                            setUiState(prev => ({...prev, playerScore: g.player.score}));
                            audio.play('explosion', e.position.x);
                            // Death anim
                             g.animations.push({ id: `e-die-${now}-${Math.random()}`, type: 'explosion', position: e.position, createdAt: now, duration: 500, color: '#f97316' });
                        } else {
                            audio.play('hit', e.position.x);
                        }
                    }
                });
            } else {
                if (g.player.status !== 'active') return;
                const dist = Math.hypot(p.position.x - g.player.position.x, p.position.y - g.player.position.y);
                if (dist < 20) {
                    g.player.health -= 1;
                    g.player.lastHitTime = now;
                    p.damage = 0;
                    g.screenShake = 10;
                    audio.play('hit', g.player.position.x);
                    setUiState(prev => ({...prev, playerHealth: g.player.health}));
                }
            }
        });
        g.projectiles = g.projectiles.filter(p => (p.damage === undefined || p.damage > 0));
        g.enemies = g.enemies.filter(e => e.status !== 'dead');
    };

    const fireProjectile = (owner: TankType | Boss, angle: number) => {
        // Fix: Remove 90 degree offset. 0 is Right.
        const rad = angle * (Math.PI/180);
        game.current.projectiles.push({
            id: `p-${Date.now()}-${Math.random()}`,
            ownerId: owner.id,
            position: { ...owner.position },
            angle: angle,
            velocity: { x: Math.cos(rad)*PROJECTILE_SPEED, y: Math.sin(rad)*PROJECTILE_SPEED },
            size: { width: 8, height: 8 },
            damage: 1
        });
        audio.play('shot', owner.position.x);
    };

    const spawnEnemy = () => {
        const x = Math.random() * (ARENA_WIDTH - 100) + 50;
        game.current.enemies.push({
            id: `e-${Date.now()}`, name: generateUsername(), type: 'enemy', status: 'spawning', spawnTime: Date.now(),
            position: { x, y: 50 }, velocity: {x:0,y:0}, angle: 90, turretAngle: 90,
            size: {width:40, height:40}, health: 6, maxHealth: 6, color: '#f97316', score: 0, kills: 0, deaths: 0
        });
    };

    const spawnBoss = (type: 'goliath' | 'viper' | 'sentinel') => {
        game.current.boss = {
            id: 'boss', name: type.toUpperCase(), bossType: type,
            position: { x: ARENA_WIDTH/2, y: 150 }, velocity: {x:0,y:0}, 
            angle: 90, // Fix: Face down (90 degrees), not Left (180)
            turretAngle: 90,
            size: { width: 80, height: 80 }, health: 100, maxHealth: 100, color: '#ef4444',
            status: 'spawning', spawnTime: Date.now(),
            attackState: { currentAttack: 'none', phase: 'idle', phaseStartTime: Date.now() }
        };
        audio.play('bossSpawn');
    };

    // --- INPUT HANDLERS ---
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            // Force lowercase for consistent checking
            game.current.keys[e.key.toLowerCase()] = true;
            
            if (game.current.player.status !== 'active') return;

            if (e.key.toLowerCase() === 'q') triggerAbility('overdrive');
            if (e.key.toLowerCase() === 'e') startCharging('cyberBeam');
            if (e.key === ' ' || e.code === 'Space') fireProjectile(game.current.player, game.current.player.turretAngle);
        };
        const onKeyUp = (e: KeyboardEvent) => {
            game.current.keys[e.key.toLowerCase()] = false;
            if (e.key.toLowerCase() === 'e') releaseCharging('cyberBeam');
        };
        const onMouseMove = (e: MouseEvent) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                // Correctly map screen coordinates to canvas internal resolution
                const scaleX = canvasRef.current!.width / rect.width;
                const scaleY = canvasRef.current!.height / rect.height;
                game.current.mouse = { 
                    x: (e.clientX - rect.left) * scaleX, 
                    y: (e.clientY - rect.top) * scaleY 
                };
            }
        };
        const onMouseDown = () => {
             if (game.current.player.status === 'active') {
                 fireProjectile(game.current.player, game.current.player.turretAngle);
             }
        }

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
            audio.play('overdrive');
            // Force UI update
            setUiState(prev => ({...prev, abilities: [...game.current.abilities]}));
        }
    };

    const startCharging = (id: string) => {
        const ab = game.current.abilities.find(a => a.id === id);
        if (ab && ab.state === 'ready') {
            ab.state = 'charging';
            ab.startTime = Date.now();
            audio.start('beamCharge');
        }
    };

    const releaseCharging = (id: string) => {
        const ab = game.current.abilities.find(a => a.id === id);
        if (ab && ab.state === 'charging') {
            ab.state = 'ready';
            audio.stop('beamCharge');
        }
    };

    // --- DRAW ---
    const draw = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
        const g = game.current;
        const now = Date.now();

        if (g.screenShake > 0) {
            ctx.save();
            ctx.translate(Math.random()*g.screenShake - g.screenShake/2, Math.random()*g.screenShake - g.screenShake/2);
            g.screenShake *= 0.9;
            if (g.screenShake < 0.5) g.screenShake = 0;
        }

        drawGrid(ctx, ARENA_WIDTH, ARENA_HEIGHT, 50);
        drawEffectZones(ctx, g.effectZones, now);
        drawTelegraphs(ctx, g.telegraphs, now);
        
        if (g.boss) drawBoss(ctx, g.boss, now, false);
        g.enemies.forEach(e => drawTank(ctx, e, now, [], false));
        drawTank(ctx, g.player, now, g.abilities, false);
        
        g.projectiles.forEach(p => drawProjectile(ctx, p, undefined, false));
        g.powerUps.forEach(p => drawPowerUp(ctx, p, now));
        drawAnimations(ctx, g.animations, now);

        if (g.screenShake > 0) ctx.restore();
    };

    return (
        <div className="relative w-full h-screen bg-[#111] overflow-hidden flex items-center justify-center cursor-none">
            <canvas ref={canvasRef} width={ARENA_WIDTH} height={ARENA_HEIGHT} className="bg-[#1a1a1a] shadow-2xl shadow-black border border-[#333]" />
            <HUD enemiesRemaining={uiState.enemiesRemaining} />
            <div className="absolute top-4 right-4 z-20">
                <Leaderboard player={{...game.current.player, score: uiState.playerScore}} enemies={game.current.enemies} />
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
