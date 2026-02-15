
import type { Tank, Projectile, Wall, Vector, Animation, PowerUp, Ability, Boss, Telegraph, EffectZone, DamageNumber, DamageIndicator, Minion, StatusEffect, PoisonStatusEffect, CutsceneState } from '../../types';

export const degToRad = (d: number) => d * (Math.PI / 180);

const SPAWN_DURATION = 1000;

// Asset Management
const powerUpImages: Record<string, HTMLImageElement> = {};

// Exact file paths as requested
const assetMap: Record<string, string> = {
    'dualCannon': 'TemporaryPowerups/DualBarrel.png',
    'shield': 'TemporaryPowerups/Shield.png',
    'regensule': 'TemporaryPowerups/HealCapsule.png',
    'lifeLeech': 'TemporaryPowerups/LifeLeech.png',
    'homingMissiles': 'TemporaryPowerups/Rocket.png',
    // Fallback for types without explicit assets
    'reflectorField': 'TemporaryPowerups/Shield.png' 
};

export const loadGameAssets = () => {
    // Only load if not already loaded
    if (Object.keys(powerUpImages).length > 0) return;

    Object.entries(assetMap).forEach(([type, src]) => {
        const img = new Image();
        // Ensure path starts with slash for public folder access
        img.src = src.startsWith('/') ? src : `/${src}`;
        powerUpImages[type] = img;
    });
};

// --- OPTIMIZATION: Cached Pattern Canvas ---
let cachedHazardCanvas: HTMLCanvasElement | null = null;

function getHazardPatternCanvas() {
    if (cachedHazardCanvas) return cachedHazardCanvas;
    
    cachedHazardCanvas = document.createElement('canvas');
    cachedHazardCanvas.width = 20; 
    cachedHazardCanvas.height = 20;
    const pCtx = cachedHazardCanvas.getContext('2d');
    if (pCtx) {
        // Transparent background
        // Draw Red Stripes
        pCtx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        pCtx.lineWidth = 4;
        
        // Diagonal line 1
        pCtx.beginPath();
        pCtx.moveTo(0, 20);
        pCtx.lineTo(20, 0);
        pCtx.stroke();
        
        // Diagonal line 2 (Corner fix for tiling)
        pCtx.beginPath();
        pCtx.moveTo(-5, 5);
        pCtx.lineTo(5, -5);
        pCtx.stroke();
        
        // Diagonal line 3 (Corner fix for tiling)
        pCtx.beginPath();
        pCtx.moveTo(15, 25);
        pCtx.lineTo(25, 15);
        pCtx.stroke();
    }
    return cachedHazardCanvas;
}

export function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, cellSize: number) {
    ctx.save();
    ctx.strokeStyle = '#111827'; 
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += cellSize) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
    for (let y = 0; y <= height; y += cellSize) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
    ctx.stroke();
    
    // Tech details
    ctx.fillStyle = '#1f2937';
    for(let x=0; x<=width; x+=cellSize*4) {
        for(let y=0; y<=height; y+=cellSize*4) {
            ctx.fillRect(x-1, y-1, 2, 2);
        }
    }
    ctx.restore();
}

export function drawLaserSweep(ctx: CanvasRenderingContext2D, position: Vector, angle: number, color: string = '#ff0000') {
    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate(degToRad(angle));

    const flicker = Math.random() * 5;
    
    // Core Beam
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 10 + flicker;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.moveTo(0, 0); // Start from the exact position passed (the tip)
    ctx.lineTo(1000, 0);
    ctx.stroke();
    
    // Outer Glow
    ctx.strokeStyle = `rgba(255, 0, 0, 0.5)`; // Consistent red glow
    ctx.lineWidth = 30 + flicker * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(1000, 0);
    ctx.stroke();
    
    ctx.restore();
}

export function drawCyberBeam(ctx: CanvasRenderingContext2D, player: Tank, target: Vector, now: number, state: string, startTime: number, chargeDuration: number = 1500, isOverdrive: boolean = false) {
    const isCharging = state === 'charging';
    
    // Determine start position (turret tip)
    // Matches logic in GameScreen for offset
    const isGoliath = (player.bossType === 'goliath' && player.type === 'player') || player.chassis === 'goliath-prime' || player.chassis === 'goliath-prime-overdrive';
    const offset = isGoliath ? 65 : 30;
    
    const rad = degToRad(player.turretAngle);
    const startX = player.position.x + Math.cos(rad) * offset;
    const startY = player.position.y + Math.sin(rad) * offset;

    ctx.save();
    
    // Determine Colors (OmniBarrage charge uses a different visual inside drawBoss/drawTank via overlays, but this function handles Cyber Beam specific charge)
    // If the ability calling this is Omni Barrage, we should render radial charge.
    // However, drawCyberBeam is specifically for linear beams. 
    // We will assume this function is ONLY called for CyberBeam ability in GameScreen logic.

    const mainColor = isOverdrive ? '#fbbf24' : '#d946ef'; // Amber vs Fuchsia
    const glowColor = isOverdrive ? 'rgba(251, 191, 36, 0.5)' : 'rgba(217, 70, 239, 0.5)';

    if (isCharging) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / chargeDuration);
        
        ctx.translate(startX, startY);
        
        // Charging Particles
        const numParticles = 8;
        const orbitRadius = 30 * (1 - progress);
        const rot = now * 0.005;
        
        ctx.fillStyle = mainColor;
        for(let i=0; i<numParticles; i++) {
            const angle = (i / numParticles) * Math.PI * 2 + rot;
            const px = Math.cos(angle) * orbitRadius;
            const py = Math.sin(angle) * orbitRadius;
            const size = (2 + progress * 2) * (0.8 + Math.random() * 0.4);
            
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI*2);
            ctx.fill();
            
            // Trailing lines for particles
            ctx.strokeStyle = mainColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(0, 0);
            ctx.stroke();
        }
        
        // Central Core
        ctx.shadowBlur = 20 * progress;
        ctx.shadowColor = mainColor;
        ctx.globalAlpha = 0.5 + (progress * 0.5);
        ctx.beginPath();
        ctx.arc(0, 0, 4 + progress * 6, 0, Math.PI*2);
        ctx.fill();
        
    } else if (state === 'active') {
        const dx = target.x - startX;
        const dy = target.y - startY;
        const len = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        
        ctx.translate(startX, startY);
        ctx.rotate(angle);
        
        // Beam Pulse
        const pulse = 1 + Math.sin(now * 0.05) * 0.1;
        
        // Outer Glow
        ctx.lineWidth = (16 * pulse);
        ctx.strokeStyle = glowColor;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 20;
        ctx.shadowColor = mainColor;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(len, 0);
        ctx.stroke();
        
        // Inner Core
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#ffffff';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(len, 0);
        ctx.stroke();
        
        // Impact Effect
        ctx.translate(len, 0);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, 8 * pulse, 0, Math.PI*2);
        ctx.fill();
        
        // Sparks
        ctx.fillStyle = mainColor;
        for(let i=0; i<6; i++) {
            const sparkA = (Math.random() - 0.5) * Math.PI * 1.5 + Math.PI; // Backward spray
            const sparkD = Math.random() * 30;
            ctx.beginPath();
            ctx.arc(Math.cos(sparkA)*sparkD, Math.sin(sparkA)*sparkD, 2, 0, Math.PI*2);
            ctx.fill();
        }
    }
    
    ctx.restore();
}

export function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss, now: number, isTimeStopped: boolean) {
    if (boss.status !== 'active' && boss.status !== 'spawning') return;
    ctx.save();
    ctx.translate(boss.position.x, boss.position.y);
    
    if (boss.attackState.currentAttack === 'lastStand') {
        const vibration = (now % 50) / 10;
        ctx.translate(Math.random() * vibration - vibration/2, Math.random() * vibration - vibration/2);
    }
    
    if (boss.status === 'spawning' && boss.spawnTime) {
        const p = Math.min(1, (now - boss.spawnTime) / 1000);
        ctx.scale(p, p); ctx.globalAlpha = p;
    }

    const isHit = boss.lastHitTime && now - boss.lastHitTime < 75;
    const baseColor = isHit ? '#fff' : boss.color;
    
    ctx.rotate(degToRad(boss.angle));
    
    const scale = boss.size.width / 80; 
    ctx.scale(scale, scale);
    
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = isHit ? 20 : 15;

    ctx.fillStyle = isHit ? '#fff' : '#1c1917';
    ctx.fillRect(-45, -50, 30, 100); 
    
    ctx.fillStyle = isHit ? '#fff' : '#450a0a'; 
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const s = 40;
    ctx.moveTo(s, 0);
    ctx.lineTo(s*0.7, s*0.7);
    ctx.lineTo(0, s);
    ctx.lineTo(-s*0.7, s*0.7);
    ctx.lineTo(-s, 0);
    ctx.lineTo(-s*0.7, -s*0.7);
    ctx.lineTo(0, -s);
    ctx.lineTo(s*0.7, -s*0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    if (!isHit) {
        const isCritical = boss.attackState.currentAttack === 'lastStand';
        const pulse = Math.abs(Math.sin(now * (isCritical ? 0.02 : 0.005)));
        
        ctx.fillStyle = isCritical 
            ? `rgba(255, 255, 255, ${0.8 + Math.random() * 0.2})` 
            : `rgba(239, 68, 68, ${0.4 + pulse * 0.6})`;
            
        ctx.shadowColor = isCritical ? '#fff' : '#ef4444';
        ctx.shadowBlur = isCritical ? 20 + Math.random() * 10 : 0;
        
        ctx.fillRect(-20, -20, 10, 40);
        ctx.fillRect(10, -20, 10, 40);
        ctx.shadowBlur = 0;
    }
    
    // --- REDESIGNED BOSS SHOCKWAVE TELEGRAPH ---
    if (boss.attackState.currentAttack === 'shockwave') {
        const p = (now - boss.attackState.phaseStartTime) / 1000;
        if (boss.attackState.phase === 'telegraphing') {
            ctx.save();
            ctx.scale(1/scale, 1/scale); 
            
            const maxRadius = 250;
            const chargeR = maxRadius * Math.min(1, p * 1.5); 
            const alpha = 0.5 + (Math.sin(now * 0.02) * 0.3);
            
            // 1. Floor Hazard Pattern
            const patternCanvas = getHazardPatternCanvas();
            const pattern = ctx.createPattern(patternCanvas, 'repeat');
            ctx.globalAlpha = p * 0.5;
            ctx.fillStyle = pattern || 'rgba(239, 68, 68, 0.2)';
            ctx.beginPath();
            ctx.arc(0, 0, maxRadius, 0, Math.PI*2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // 2. Rotating Reactor Rings
            ctx.lineWidth = 2;
            const numRings = 3;
            for(let i=0; i<numRings; i++) {
                const r = maxRadius * (0.3 + (i * 0.25));
                const rot = (now * 0.002) * (i % 2 === 0 ? 1 : -1);
                ctx.save();
                ctx.rotate(rot);
                ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
                ctx.setLineDash([20, 10]);
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI*2);
                ctx.stroke();
                ctx.restore();
            }

            // 3. Energy Particles Sucking In
            const numParticles = 12;
            const gatherR = maxRadius * (1 - p); // Shrinking radius
            ctx.fillStyle = '#ffaaaa';
            for(let i=0; i<numParticles; i++) {
                const a = (Math.PI * 2 / numParticles) * i + now * 0.005;
                const px = Math.cos(a) * gatherR;
                const py = Math.sin(a) * gatherR;
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI*2);
                ctx.fill();
            }

            // 4. Central Core Intensity
            const coreColor = `rgba(255, ${Math.max(0, 255 - (p * 255))}, ${Math.max(0, 255 - (p * 255))}, 1)`; // Fade white to red
            ctx.fillStyle = coreColor;
            ctx.shadowColor = '#f00';
            ctx.shadowBlur = 20 * p;
            ctx.beginPath();
            ctx.arc(0, 0, 15 + (p * 20), 0, Math.PI*2);
            ctx.fill();
            
            ctx.restore();
        }
    }
    // --- OMNI BARRAGE TELEGRAPH ---
    if (boss.attackState.currentAttack === 'omniBarrage' && boss.attackState.phase === 'telegraphing') {
        const p = Math.min(1, (now - boss.attackState.phaseStartTime) / (boss.attackState.attackData?.telegraphDuration || 1500));
        ctx.save();
        ctx.scale(1/scale, 1/scale);
        
        const pulses = 3;
        for(let i=0; i<pulses; i++) {
             const offsetP = (p + i/pulses) % 1;
             ctx.beginPath();
             ctx.arc(0, 0, 150 * (1-offsetP), 0, Math.PI*2);
             ctx.strokeStyle = `rgba(255, 60, 60, ${offsetP})`;
             ctx.lineWidth = 4 * offsetP;
             ctx.stroke();
        }

        const numParticles = 20;
        const radius = 120 * (1-p);
        ctx.fillStyle = '#ef4444';
        for(let i=0; i<numParticles; i++) {
             const a = (i/numParticles) * Math.PI*2 + now*0.01;
             ctx.beginPath();
             ctx.arc(Math.cos(a)*radius, Math.sin(a)*radius, 4, 0, Math.PI*2);
             ctx.fill();
        }
        
        ctx.restore();
    }

    ctx.shadowBlur = isHit ? 20 : 0; 
    ctx.rotate(degToRad(boss.turretAngle - boss.angle));
    
    ctx.fillStyle = isHit ? '#fff' : '#1f2937';
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 2;
    
    ctx.fillRect(10, -18, 55, 12);
    ctx.fillRect(10, 6, 55, 12);
    
    ctx.fillStyle = isHit ? '#fff' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    const isOmni = boss.attackState.currentAttack === 'omniBarrage';
    ctx.fillStyle = isHit ? '#fff' : (isOmni ? '#ff0000' : '#fca5a5');
    ctx.beginPath(); ctx.arc(0, 0, isOmni ? 10 : 8, 0, Math.PI*2); ctx.fill();
    
    if (isOmni) {
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 10 + Math.random() * 10;
    }

    if (boss.attackState.phase === 'telegraphing') {
       const isLaser = boss.attackState.currentAttack === 'laserSweep';
       
       ctx.shadowColor = (isLaser) ? '#ff0000' : '#ef4444';
       ctx.shadowBlur = 20 + Math.random() * 10;
       ctx.fillStyle = '#fff';
       
       if (isLaser) {
           ctx.beginPath(); ctx.arc(65, 0, 6, 0, Math.PI*2); ctx.fill();
           ctx.save();
           ctx.setLineDash([5, 5]);
           ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
           ctx.lineWidth = 2;
           ctx.beginPath();
           ctx.moveTo(65, 0);
           ctx.lineTo(800, -200); 
           ctx.moveTo(65, 0);
           ctx.lineTo(800, 200);
           ctx.stroke();
           ctx.restore();
       } else if (boss.attackState.currentAttack === 'mortarVolley') {
           ctx.beginPath(); ctx.arc(65, -12, 5, 0, Math.PI*2); ctx.fill();
           ctx.beginPath(); ctx.arc(65, 12, 5, 0, Math.PI*2); ctx.fill();
       }
    }
    
    ctx.restore(); // End boss transform
    
    if (boss.attackState.currentAttack === 'laserSweep' && boss.attackState.phase === 'attacking') {
         const rad = degToRad(boss.turretAngle);
         // Calculate tip position manually for drawLaserSweep since we are outside the transform
         const tip = {
             x: boss.position.x + Math.cos(rad) * 65,
             y: boss.position.y + Math.sin(rad) * 65
         };
         drawLaserSweep(ctx, tip, boss.turretAngle, '#ff0000');
    }
}

export function drawLastStandWarning(ctx: CanvasRenderingContext2D, boss: Boss, now: number) {
    if (boss.attackState.currentAttack !== 'lastStand') return;
    
    const startTime = boss.attackState.phaseStartTime;
    const duration = 3000;
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const maxRadius = 300;
    
    ctx.save();
    ctx.translate(boss.position.x, boss.position.y);
    
    const currentRadius = maxRadius * progress;
    
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 0, 0, ${0.1 + (Math.random() * 0.05)})`;
    ctx.fill();
    
    const numLines = 12;
    const rotateSpeed = now * 0.002;
    ctx.strokeStyle = `rgba(255, 0, 0, ${0.5 * progress})`;
    ctx.lineWidth = 2;
    
    for (let i = 0; i < numLines; i++) {
        const angle = (i / numLines) * Math.PI * 2 + rotateSpeed;
        const cycle = (now % 1000) / 1000;
        const rStart = currentRadius;
        const rEnd = currentRadius * (1 - cycle); 
        
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * rStart, Math.sin(angle) * rStart);
        ctx.lineTo(Math.cos(angle) * rEnd, Math.sin(angle) * rEnd);
        ctx.stroke();
    }

    const unstableR = 50 + Math.random() * 10;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, unstableR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 0, 0, ${0.8 + Math.random() * 0.2})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 10]);
    ctx.lineDashOffset = -now * 0.1;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (progress > 0.2) {
        ctx.save();
        const tx = (Math.random() - 0.5) * 4;
        const ty = (Math.random() - 0.5) * 4;
        ctx.translate(tx, ty);
        
        ctx.fillStyle = '#fff';
        ctx.font = '900 32px "Orbitron"';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'red';
        ctx.shadowBlur = 20;
        
        const textAlpha = Math.abs(Math.sin(now * 0.01));
        ctx.globalAlpha = textAlpha;
        ctx.fillText("CORE MELTDOWN", 0, -80);
        
        ctx.font = 'bold 16px "Orbitron"';
        ctx.fillStyle = '#ffaaaa';
        ctx.fillText(`DETONATION IN ${(3 - (elapsed/1000)).toFixed(1)}s`, 0, 80);
        ctx.restore();
    }

    ctx.restore();
}

export function drawTank(ctx: CanvasRenderingContext2D, tank: Tank, now: number, abilities: Ability[], isTimeStopped: boolean) {
    if (tank.status === 'dead') return;
    
    // Check if player is mimicking a boss for Sandbox mode
    const isPlayer = tank.type === 'player';
    const isGoliath = (isPlayer && tank.bossType === 'goliath') || tank.chassis === 'goliath-prime';
    const isOverdrive = tank.chassis === 'goliath-prime-overdrive';
    
    // If Player is in Goliath Mode, we need to draw using Boss Geometry but with Player status/color logic
    if (isGoliath || isOverdrive) {
        // Construct a temporary boss object to reuse drawBoss logic (or replicate geometry here)
        // Replicating simplified geometry to avoid type casting chaos and keep color control
        ctx.save();
        ctx.translate(tank.position.x, tank.position.y);
        
        // --- POWER-UP AURAS (Before rotation) ---
        if (tank.activePowerUp === 'lifeLeech' || tank.activePowerUp === 'regensule') {
            ctx.save();
            const pulse = Math.sin(now * 0.005) * 0.2 + 0.5;
            if (tank.activePowerUp === 'lifeLeech') {
                ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
                ctx.lineWidth = 3;
                ctx.setLineDash([10, 10]);
                ctx.rotate(now * 0.001);
                ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI*2); ctx.stroke();
            } else {
                ctx.fillStyle = `rgba(74, 222, 128, ${pulse * 0.3})`;
                ctx.beginPath(); ctx.arc(0, 0, 65, 0, Math.PI*2); ctx.fill();
            }
            ctx.restore();
        }
        
        // OMNI BARRAGE PLAYER CHARGING
        const omni = abilities?.find(a => a.id === 'omniBarrage' && a.state === 'charging');
        if (omni) {
             const elapsed = now - (omni.startTime || 0);
             const progress = Math.min(1, elapsed / (omni.chargeDuration || 1500));
             ctx.fillStyle = `rgba(255, 60, 60, ${progress * 0.5})`;
             ctx.beginPath();
             ctx.arc(0, 0, 80 * progress, 0, Math.PI*2);
             ctx.fill();
             
             ctx.strokeStyle = `rgba(255, 60, 60, 0.8)`;
             ctx.lineWidth = 2;
             const rings = 3;
             for(let i=0; i<rings; i++) {
                 const r = 80 * ((progress + i/rings)%1);
                 ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.stroke();
             }
        }
        
        // Overdrive Aura (Standard)
        if (isOverdrive) {
            const flicker = Math.random() * 0.2 + 0.8;
            
            // True Form Aura: More aggressive, multi-layered
            // 1. Inner Core Glow
            ctx.fillStyle = `rgba(185, 28, 28, ${0.1 * flicker})`;
            ctx.beginPath(); ctx.arc(0, 0, 100, 0, Math.PI*2); ctx.fill();

            // 2. Rotating Jagged Rings
            ctx.save();
            ctx.rotate(now * 0.002);
            ctx.strokeStyle = `rgba(245, 158, 11, ${0.6 * flicker})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([20, 10]);
            ctx.beginPath(); ctx.arc(0, 0, 90, 0, Math.PI*2); ctx.stroke();
            
            ctx.rotate(now * 0.003); // Counter spin layer
            ctx.strokeStyle = `rgba(185, 28, 28, ${0.8 * flicker})`; // Dark red
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 15]);
            ctx.beginPath(); ctx.arc(0, 0, 100, 0, Math.PI*2); ctx.stroke();
            ctx.restore();

            // 3. Electric Sparks
            if (Math.random() > 0.7) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 70 + Math.random() * 30;
                ctx.strokeStyle = '#fcd34d';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle)*60, Math.sin(angle)*60);
                ctx.lineTo(Math.cos(angle)*dist, Math.sin(angle)*dist);
                ctx.stroke();
            }
        }

        ctx.rotate(degToRad(tank.angle));
        
        const scale = tank.size.width / 80; 
        ctx.scale(scale, scale);
        
        const isHit = tank.lastHitTime && now - tank.lastHitTime < 75;
        const baseColor = isHit ? '#fff' : (isOverdrive ? '#b91c1c' : tank.color);
        const accentColor = isOverdrive ? '#fbbf24' : '#7f1d1d';
        
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = isHit ? 20 : 15;

        // Goliath Chassis
        ctx.fillStyle = isHit ? '#fff' : '#1c1917';
        ctx.fillRect(-45, -50, 30, 100); 
        
        ctx.fillStyle = isHit ? '#fff' : '#450a0a'; 
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        const s = 40;
        ctx.moveTo(s, 0); ctx.lineTo(s*0.7, s*0.7); ctx.lineTo(0, s);
        ctx.lineTo(-s*0.7, s*0.7); ctx.lineTo(-s, 0); ctx.lineTo(-s*0.7, -s*0.7);
        ctx.lineTo(0, -s); ctx.lineTo(s*0.7, -s*0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Extra details for Overdrive
        if (isOverdrive) {
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(s-5, -5, 10, 10);
            ctx.fillRect(-s-5, -5, 10, 10);
            ctx.fillRect(-5, s-5, 10, 10);
            ctx.fillRect(-5, -s-5, 10, 10);
        }

        // Turret Rotation
        ctx.rotate(degToRad(tank.turretAngle - tank.angle));
        
        ctx.fillStyle = isHit ? '#fff' : '#1f2937';
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 2;
        
        // Double Barrel (Standard)
        ctx.fillRect(10, -18, 55, 12);
        ctx.fillRect(10, 6, 55, 12);
        
        // --- DUAL CANNON POWER-UP (Quad Barrel) ---
        if (tank.activePowerUp === 'dualCannon' || isOverdrive) {
            ctx.fillStyle = isHit ? '#fff' : '#1f2937';
            // Outer barrels
            ctx.fillRect(5, -30, 50, 10);
            ctx.fillRect(5, 20, 50, 10);
            
            if (!isHit) {
                ctx.fillStyle = baseColor;
                ctx.fillRect(50, -30, 5, 10);
                ctx.fillRect(50, 20, 5, 10);
            }
        }
        
        // --- MISSILE PODS POWER-UP ---
        if (tank.activePowerUp === 'homingMissiles') {
            ctx.fillStyle = isHit ? '#fff' : '#333';
            ctx.fillRect(-25, -50, 20, 15);
            ctx.fillRect(-25, 35, 20, 15);
            // Missiles
            ctx.fillStyle = '#ef4444';
            const c = Math.ceil((tank.homingMissileCount||0)/2);
            for(let i=0; i<Math.min(3, c); i++) {
                 ctx.beginPath(); ctx.arc(-22 + i*6, -42, 3, 0, Math.PI*2); ctx.fill();
                 ctx.beginPath(); ctx.arc(-22 + i*6, 42, 3, 0, Math.PI*2); ctx.fill();
            }
        }

        ctx.fillStyle = isHit ? '#fff' : accentColor;
        ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI*2); ctx.fill(); ctx.stroke();

        // Red Eye
        ctx.fillStyle = isHit ? '#fff' : (isOverdrive ? '#fbbf24' : '#fca5a5');
        ctx.shadowColor = isOverdrive ? '#fbbf24' : '#f00';
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        
        // --- SHIELD POWER-UP ---
        if (tank.shieldHealth && tank.shieldHealth > 0) {
             ctx.rotate(-degToRad(tank.turretAngle - tank.angle)); // Revert local rotation
             ctx.strokeStyle = `rgba(6, 182, 212, ${0.4 + Math.sin(now*0.008)*0.2})`;
             ctx.lineWidth = 4;
             ctx.shadowColor = '#06b6d4';
             ctx.shadowBlur = 15;
             ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI*2); ctx.stroke();
             // Pips
             for(let i=0; i<tank.shieldHealth; i++) {
                 const angle = (i / 5) * Math.PI - Math.PI/2;
                 ctx.fillStyle = '#06b6d4';
                 ctx.beginPath(); ctx.arc(Math.cos(angle)*80, Math.sin(angle)*80, 4, 0, Math.PI*2); ctx.fill();
             }
        }

        ctx.restore();
        return; // Skip standard tank drawing
    }

    ctx.save();
    ctx.translate(tank.position.x, tank.position.y);

    if (tank.status === 'spawning' && tank.spawnTime) {
        const p = Math.min(1, (now - tank.spawnTime) / 1000);
        ctx.scale(p, p); 
        ctx.globalAlpha = p;
    }

    const isHit = tank.lastHitTime && now - tank.lastHitTime < 75;
    
    const cFill = (col: string) => isHit ? '#ffffff' : col;
    const cStroke = (col: string) => isHit ? '#ffffff' : col;

    // --- ENEMY POWER-UP AURAS ---
    if (!isPlayer && tank.activePowerUp) {
        ctx.save();
        if (tank.activePowerUp === 'lifeLeech') {
            // Red vampiric aura
            const pulse = Math.sin(now * 0.005) * 0.2 + 0.5;
            ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.lineDashOffset = -now * 0.02;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI*2);
            ctx.stroke();
        } else if (tank.activePowerUp === 'regensule') {
            // Green healing aura
            const pulse = Math.sin(now * 0.003) * 0.2 + 0.4;
            ctx.fillStyle = `rgba(74, 222, 128, ${pulse * 0.3})`;
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.restore();
    }

    // --- DAMAGE CONVERTER AURA (Flux Matrix) ---
    // If the tank has stored charge, visualize it as an aura
    if (tank.damageConverterCharge && tank.damageConverterCharge > 0) {
        const chargeRatio = Math.min(1, tank.damageConverterCharge / 50); // Cap at 50 for max visual intensity
        const auraSize = 40 + (chargeRatio * 20); // Aura grows
        const auraAlpha = 0.3 + (chargeRatio * 0.5);
        
        ctx.save();
        // Electric pulse effect
        const pulse = Math.sin(now * 0.02) * 5;
        
        // Outer glow
        ctx.beginPath();
        ctx.arc(0, 0, auraSize + pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${auraAlpha * 0.4})`; // Violet
        ctx.fill();
        
        // Inner intense ring
        ctx.beginPath();
        ctx.arc(0, 0, (auraSize * 0.8) - pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(167, 139, 250, ${auraAlpha})`;
        ctx.lineWidth = 2 + (chargeRatio * 3);
        ctx.setLineDash([10, 5]);
        ctx.lineDashOffset = now * 0.05;
        ctx.stroke();

        // Lightning crackles
        if (chargeRatio > 0.3) {
            ctx.strokeStyle = '#ddd6fe';
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            const numSparks = Math.floor(chargeRatio * 5);
            for(let i=0; i<numSparks; i++) {
                 const angle = Math.random() * Math.PI * 2;
                 const dist = 20 + Math.random() * 20;
                 ctx.beginPath();
                 ctx.moveTo(Math.cos(angle)*20, Math.sin(angle)*20);
                 ctx.lineTo(Math.cos(angle)*dist, Math.sin(angle)*dist);
                 ctx.stroke();
            }
        }
        ctx.restore();
    }

    ctx.rotate(degToRad(tank.angle));

    if (tank.chassis === 'rogue-scout') {
        // --- REMASTERED ROGUE SCOUT ---
        const primary = tank.color || '#FF003C';
        const dark = '#1c1917';
        
        ctx.shadowColor = isHit ? '#ffffff' : primary;
        ctx.shadowBlur = isHit ? 20 : 15;

        // Sharper, more aggressive delta
        ctx.fillStyle = cFill(dark);
        ctx.strokeStyle = cStroke(primary);
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(22, 0);     // Extended Nose
        ctx.lineTo(-12, 14);   // Wing tip back
        ctx.lineTo(-8, 4);     // Inner notch
        ctx.lineTo(-8, -4);    // Inner notch
        ctx.lineTo(-12, -14);  // Wing tip back
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Engines
        if (!isHit) {
            ctx.fillStyle = primary;
            ctx.fillRect(-12, -3, 4, 6);
        }

        ctx.rotate(degToRad(tank.turretAngle - tank.angle));
        
        // Sleek Turret
        ctx.fillStyle = cFill('#334155');
        ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI*2); ctx.fill();
        
        // Sensor Eye
        if (!isHit) {
            ctx.fillStyle = primary;
            ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(3, 0, 2, 0, Math.PI*2); ctx.fill();
        }

    } else if (isPlayer && (!tank.chassis || tank.chassis === 'vector-01')) {
        // --- VECTOR-01 (Standard Hover Tank) ---
        const primary = tank.color || '#00F0FF';
        const dark = '#020617';

        ctx.shadowColor = isHit ? '#ffffff' : primary;
        ctx.shadowBlur = isHit ? 20 : 10;
        
        // ... Auras logic handled above ...

        ctx.fillStyle = cFill(dark);
        ctx.strokeStyle = cStroke(primary);
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(-10, -20); ctx.lineTo(15, -20); ctx.lineTo(10, -12); ctx.lineTo(-15, -12);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-10, 20); ctx.lineTo(15, 20); ctx.lineTo(10, 12); ctx.lineTo(-15, 12);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        
        if (!isHit) {
            const flicker = Math.random() * 0.3 + 0.7;
            ctx.fillStyle = primary;
            ctx.globalAlpha = 0.6 * flicker;
            ctx.fillRect(-18, -18, 4, 6);
            ctx.fillRect(-18, 12, 4, 6);
            ctx.globalAlpha = 1.0;
        }

        ctx.fillStyle = cFill('#1e293b');
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-5, 8);
        ctx.lineTo(-12, 4);
        ctx.lineTo(-12, -4);
        ctx.lineTo(-5, -8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        if (!isHit) {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(-4, 0, 3, 0, Math.PI*2); ctx.fill();
        }

        // Overdrive Visuals...
        const overdrive = abilities?.find(a => a.id === 'overdrive' && a.state === 'active');
        if (overdrive && !isHit) {
             // ... existing overdrive drawing ...
             ctx.save();
             const gold = '#f59e0b';
             const brightGold = '#fcd34d';
             const intenseWhite = '#ffffff';
             ctx.shadowBlur = 30; ctx.shadowColor = brightGold;
             ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; ctx.beginPath(); ctx.arc(0, 0, 35, 0, Math.PI * 2); ctx.fill();
             // ... (rest of overdrive visuals)
             ctx.restore();
        }

        ctx.rotate(degToRad(tank.turretAngle - tank.angle));
        
        if (tank.activePowerUp === 'dualCannon') {
            ctx.fillStyle = cFill('#334155');
            ctx.fillRect(0, -9, 32, 6); 
            ctx.fillRect(0, 3, 32, 6);  
            if (!isHit) {
                ctx.fillStyle = primary;
                ctx.fillRect(6, -7, 20, 2); 
                ctx.fillRect(6, 5, 20, 2);  
            }
        } else if (tank.activePowerUp === 'homingMissiles') {
            ctx.fillStyle = cFill('#334155');
            ctx.fillRect(-2, -3, 32, 6);
            if (!isHit) { ctx.fillStyle = primary; ctx.fillRect(4, -1, 20, 2); }
            ctx.save();
            ctx.fillStyle = cFill('#1e293b'); ctx.fillRect(-6, -16, 12, 6);
            ctx.fillStyle = isHit ? '#fff' : '#ef4444';
            const count = tank.homingMissileCount || 0;
            for(let i=0; i<Math.min(3, Math.ceil(count/2)); i++) { ctx.beginPath(); ctx.arc(-4 + i*4, -13, 2, 0, Math.PI*2); ctx.fill(); }
            ctx.fillStyle = cFill('#1e293b'); ctx.fillRect(-6, 10, 12, 6);
            ctx.fillStyle = isHit ? '#fff' : '#ef4444';
            for(let i=0; i<Math.min(3, Math.floor(count/2)); i++) { ctx.beginPath(); ctx.arc(-4 + i*4, 13, 2, 0, Math.PI*2); ctx.fill(); }
            ctx.restore();
        } else {
            ctx.fillStyle = cFill('#334155');
            ctx.fillRect(-2, -3, 32, 6);
            if (!isHit) { ctx.fillStyle = primary; ctx.fillRect(4, -1, 20, 2); }
        }

        ctx.fillStyle = cFill(dark);
        ctx.strokeStyle = cStroke(primary);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();

    } else {
        // --- IRON BASTION / ENEMIES ---
        const primary = tank.color || '#f97316';
        const dark = '#1c1917'; 
        const metal = '#44403c';

        ctx.shadowColor = isHit ? '#ffffff' : primary;
        ctx.shadowBlur = isHit ? 20 : 5;

        if (tank.tier === 'intermediate' || tank.chassis === 'iron-bastion') {
            ctx.fillStyle = cFill('#292524');
            ctx.fillRect(-20, -26, 40, 12);
            ctx.fillRect(-20, 14, 40, 12);
            
            if (!isHit) {
                ctx.fillStyle = '#44403c';
                for(let i=-20; i<20; i+=6) {
                    ctx.fillRect(i, -26, 2, 12);
                    ctx.fillRect(i, 14, 2, 12);
                }
            }

            ctx.fillStyle = cFill(metal);
            ctx.strokeStyle = cStroke(primary);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(-15, -18, 30, 36);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = cFill(dark);
            ctx.fillRect(-10, -10, 10, 20); 

            ctx.rotate(degToRad(tank.turretAngle - tank.angle));
            
            ctx.fillStyle = cFill('#292524');
            ctx.fillRect(0, -5, 28, 10);
            
            if (tank.activePowerUp === 'dualCannon') {
                 ctx.fillStyle = cFill('#292524');
                 ctx.fillRect(0, -8, 28, 4);
                 ctx.fillRect(0, 4, 28, 4);
                 if (!isHit) {
                    ctx.fillStyle = primary;
                    ctx.fillRect(26, -8, 4, 4);
                    ctx.fillRect(26, 4, 4, 4);
                 }
            } else {
                ctx.fillStyle = cFill(primary);
                ctx.fillRect(26, -6, 4, 12);
            }
            
            if (tank.activePowerUp === 'homingMissiles') {
                ctx.save();
                ctx.fillStyle = '#333'; ctx.fillRect(-5, -20, 10, 6); ctx.fillRect(-5, 14, 10, 6);
                ctx.fillStyle = '#ef4444';
                const count = Math.min(3, Math.ceil((tank.homingMissileCount || 0) / 3));
                for(let i=0; i<count; i++) { ctx.beginPath(); ctx.arc(-2 + i*3, -17, 2, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(-2 + i*3, 17, 2, 0, Math.PI*2); ctx.fill(); }
                ctx.restore();
            }

            ctx.fillStyle = cFill(dark);
            ctx.strokeStyle = cStroke(primary);
            ctx.fillRect(-10, -10, 20, 20);
            ctx.strokeRect(-10, -10, 20, 20);
            
            if (!isHit) { ctx.fillStyle = primary; ctx.fillRect(2, -8, 4, 4); }

        } else {
            // Basic Enemy Tank (Default Fallback)
            ctx.fillStyle = cFill(dark);
            ctx.strokeStyle = cStroke(primary);
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.moveTo(18, 0);   
            ctx.lineTo(-12, 16); 
            ctx.lineTo(-8, 5);   
            ctx.lineTo(-8, -5);  
            ctx.lineTo(-12, -16);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            if (!isHit) {
                ctx.fillStyle = primary;
                ctx.shadowBlur = 10;
                ctx.shadowColor = primary;
                ctx.fillRect(-12, 6, 4, 4);
                ctx.fillRect(-12, -10, 4, 4);
                ctx.shadowBlur = 0; 
            }

            ctx.rotate(degToRad(tank.turretAngle - tank.angle));
            
            ctx.fillStyle = cFill(metal);
            ctx.strokeStyle = cStroke(primary);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();

            // DUAL CANNON - Basic tank
            if (tank.activePowerUp === 'dualCannon') {
                ctx.fillStyle = cFill('#292524');
                ctx.fillRect(0, -6, 22, 4); ctx.fillRect(0, 2, 22, 4); 
                if (!isHit) { ctx.fillStyle = primary; ctx.fillRect(20, -5, 4, 2); ctx.fillRect(20, 3, 4, 2); }
            } else {
                ctx.fillStyle = cFill('#292524');
                ctx.fillRect(0, -3, 22, 6); 
                if (!isHit) { ctx.fillStyle = primary; ctx.fillRect(8, -1, 10, 2); }
                ctx.fillStyle = cFill(primary);
                ctx.fillRect(20, -2, 4, 4);
            }
            
            if (tank.activePowerUp === 'homingMissiles') {
                ctx.save();
                ctx.rotate(-Math.PI/2);
                ctx.fillStyle = '#333'; ctx.fillRect(-8, -8, 16, 6);
                ctx.fillStyle = '#ef4444';
                const count = Math.min(4, Math.ceil((tank.homingMissileCount || 0) / 2));
                 for(let i=0; i<count; i++) { ctx.beginPath(); ctx.arc(-6 + i*4, -5, 2, 0, Math.PI*2); ctx.fill(); }
                ctx.restore();
            }
        }
    }

    if (tank.shieldHealth && tank.shieldHealth > 0) {
        ctx.rotate(-degToRad(tank.turretAngle - tank.angle)); 
        ctx.strokeStyle = `rgba(6, 182, 212, ${0.4 + Math.sin(now*0.008)*0.2})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI*2);
        ctx.stroke();
        
        ctx.fillStyle = `rgba(6, 182, 212, 0.05)`;
        ctx.fill();
        
        const maxShield = 5; 
        const pips = tank.shieldHealth;
        for(let i=0; i<pips; i++) {
             const angle = (i / maxShield) * Math.PI - Math.PI/2;
             const px = Math.cos(angle) * 36;
             const py = Math.sin(angle) * 36;
             ctx.fillStyle = '#06b6d4';
             ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI*2); ctx.fill();
        }
    }

    ctx.restore();
}

export function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile, owner: any, isToxic: boolean) {
    ctx.save();
    ctx.translate(proj.position.x, proj.position.y);
    ctx.rotate(degToRad(proj.angle));
    const isPlayer = proj.ownerId === 'player';
    const coreColor = '#ffffff';
    const glowColor = proj.color || (isPlayer ? '#00F0FF' : '#ef4444');
    
    if (proj.isHoming) {
        ctx.scale(1.2, 1.2);
        if (proj.isVampiric) {
            ctx.shadowBlur = 10; ctx.shadowColor = '#22c55e';
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-15, 0); ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#bbf7d0'; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -3); ctx.lineTo(-4, 3); ctx.fill();
            ctx.fillStyle = '#4ade80'; ctx.beginPath(); ctx.arc(-4, 0, 2, 0, Math.PI*2); ctx.fill();
            ctx.restore(); return;
        }
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-25, 0); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)'; ctx.stroke();
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(0, -3); ctx.lineTo(-6, -3); ctx.lineTo(-6, 3); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(-10, -5); ctx.lineTo(-8, 0); ctx.lineTo(-10, 5); ctx.lineTo(-6, 3); ctx.fill();
        ctx.fillStyle = '#fbbf24'; ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(-8, 0, 2, 0, Math.PI*2); ctx.fill();
        ctx.restore(); return;
    }

    ctx.shadowBlur = 15; ctx.shadowColor = glowColor;
    const pulse = 1 + Math.sin(Date.now() * 0.02) * 0.1; ctx.scale(pulse, pulse);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-20, 0); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = glowColor; ctx.globalAlpha = 0.6; ctx.stroke();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = coreColor; ctx.beginPath(); ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = glowColor; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
}

export function drawDamageNumbers(ctx: CanvasRenderingContext2D, nums: DamageNumber[], now: number) {
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    nums.forEach(num => {
        const elapsed = now - num.createdAt; if (elapsed > num.duration) return;
        const progress = elapsed / num.duration; const easeOut = 1 - Math.pow(1 - progress, 3); const yOffset = easeOut * 45; 
        let scale = 1; if (progress < 0.15) { scale = progress / 0.15; } else if (progress < 0.3) { scale = 1 + (0.3 - progress) * 0.5; } else { scale = 1; }
        const alpha = progress > 0.7 ? 1 - ((progress - 0.7) / 0.3) : 1;
        ctx.save(); ctx.translate(num.position.x, num.position.y - yOffset); ctx.scale(scale, scale); ctx.globalAlpha = alpha;
        const val = parseInt(num.text); const isCrit = !isNaN(val) && val >= 4; const isHeal = num.text === 'REPAIR' || num.text.includes('+') || num.text === 'LEECH';
        ctx.font = (isCrit || isHeal) ? '900 24px "Orbitron", sans-serif' : 'bold 16px "Orbitron", sans-serif';
        ctx.shadowColor = num.color; ctx.shadowBlur = isCrit ? 20 : 8;
        ctx.strokeStyle = '#000000'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeText(num.text, 0, 0);
        ctx.fillStyle = num.color; ctx.fillText(num.text, 0, 0);
        if (isCrit) { ctx.fillStyle = '#ffffff'; ctx.globalAlpha = alpha * 0.7; ctx.fillText(num.text, 0, 0); }
        ctx.restore();
    });
    ctx.restore();
}

export function drawTelegraphs(ctx: CanvasRenderingContext2D, telegraphs: Telegraph[], now: number) {
    if (telegraphs.length === 0) return;
    const patternCanvas = getHazardPatternCanvas(); const pattern = ctx.createPattern(patternCanvas, 'repeat');
    telegraphs.forEach(t => {
        const progress = Math.min(1, (now - t.createdAt) / t.duration);
        ctx.save(); ctx.translate(t.position.x, t.position.y);
        const pulse = 0.5 + Math.sin(now * 0.01) * 0.3; ctx.globalAlpha = pulse;
        if (pattern) { ctx.fillStyle = pattern; } else { ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; }
        ctx.strokeStyle = `rgba(239, 68, 68, 0.8)`; ctx.lineWidth = 2;
        if (t.type === 'circle') {
            const r = t.radius || 50; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(0, 0, r * (1-progress), 0, Math.PI*2); ctx.strokeStyle = '#ffaaaa'; ctx.stroke();
        }
        if (t.id.includes('mine')) {
             ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.arc(0, 5, 12, 0, Math.PI*2); ctx.fill();
             const scale = Math.min(1, progress * 4); ctx.scale(scale, scale); ctx.rotate(now * 0.005);
             ctx.fillStyle = '#1f2937'; ctx.beginPath(); const spikes = 6; for(let i=0; i<spikes * 2; i++) { const r = i % 2 === 0 ? 14 : 8; const a = (i / (spikes * 2)) * Math.PI * 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#f97316'; ctx.lineWidth = 1.5; ctx.stroke();
             const blinkSpeed = progress > 0.7 ? 25 : 4; const blink = Math.sin(now * 0.001 * blinkSpeed) > 0;
             ctx.fillStyle = blink ? '#ff0000' : '#450a0a'; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = blink ? 15 : 0; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
             if (progress > 0.4) { ctx.strokeStyle = `rgba(255, 0, 0, ${0.5})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 20 * progress, 0, Math.PI*2); ctx.stroke(); }
        }
        ctx.restore();
    });
}

export function drawAnimations(ctx: CanvasRenderingContext2D, animations: Animation[], now: number) {
    animations.forEach(anim => {
        const elapsed = now - anim.createdAt; if (elapsed > anim.duration) return; const progress = elapsed / anim.duration;
        ctx.save(); ctx.translate(anim.position.x, anim.position.y);
        
        if (anim.type === 'transformFlash') {
            const alpha = progress < 0.2 ? progress * 5 : 1 - ((progress - 0.2) / 0.8);
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = alpha;
            ctx.fillRect(-2000, -2000, 4000, 4000);
            
            // Rings
            ctx.globalAlpha = alpha * 0.8;
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.arc(0, 0, progress * 1000, 0, Math.PI * 2);
            ctx.stroke();
        } else if (anim.type === 'transformCharge') {
            // REFINED IMPLOSION EFFECT
            const maxR = 200; // Larger suck-in radius
            const numParticles = 40; // More particles
            const gatherProgress = Math.pow(progress, 3); // Cubic ease-in for faster snap at end

            // Shaking Core
            const shake = (1 - gatherProgress) * 5;
            const shakeX = (Math.random() - 0.5) * shake;
            const shakeY = (Math.random() - 0.5) * shake;
            
            // Color Shift from Blue to Red/Gold
            const r = Math.floor(255 * gatherProgress);
            const g = Math.floor(255 * (1 - gatherProgress) * 0.8); // Fade out green/blue
            const b = Math.floor(255 * (1 - gatherProgress));
            const color = `rgb(${r}, ${Math.max(0, r-50)}, ${0})`; // Transition to Orange/Gold

            // Central ball growing with intensity
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 20 * gatherProgress;
            ctx.beginPath();
            ctx.arc(shakeX, shakeY, gatherProgress * 60, 0, Math.PI*2);
            ctx.fill();
            
            // Inner suction lines
            ctx.lineWidth = 2 * gatherProgress + 1;
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - gatherProgress})`;
            
            const numLines = 12;
            for(let i=0; i<numLines; i++) {
                const angle = (i/numLines) * Math.PI*2 + (now * 0.02 * (1 + gatherProgress*5)); // Spin faster
                ctx.beginPath();
                // Start far, end at center
                const dist = 120 * (1 - gatherProgress);
                const len = 30 * (1-gatherProgress);
                
                const x1 = Math.cos(angle) * dist;
                const y1 = Math.sin(angle) * dist;
                const x2 = Math.cos(angle) * (dist + len);
                const y2 = Math.sin(angle) * (dist + len);
                
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }

            // Particles sucking in spiral
            ctx.fillStyle = '#fff';
            for(let i=0; i<numParticles; i++) {
                const angleOffset = i * 137.5; // Golden angle dispersion
                const particleP = (progress * 1.5 + (i/numParticles)) % 1; // Loop particles
                const radius = maxR * (1 - particleP);
                const angle = angleOffset + (now * 0.01 * (1/particleP)); // Swirl faster as closer
                
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                ctx.globalAlpha = particleP;
                ctx.beginPath();
                ctx.arc(x, y, 2 + particleP * 3, 0, Math.PI*2);
                ctx.fill();
            }
        }
        else if (anim.type === 'explosion' || anim.type === 'hit') {
            const radius = (anim.width || 30) * progress; ctx.globalAlpha = 1 - progress; ctx.fillStyle = anim.color || '#f97316'; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
        } else if (anim.type === 'shockwave') {
             // REDESIGNED SHOCKWAVE ANIMATION
             const maxRadius = anim.width || 200;
             const p = progress;
             
             // 1. Initial Flash
             if (p < 0.2) {
                 ctx.fillStyle = `rgba(255, 255, 255, ${1 - (p * 5)})`;
                 ctx.beginPath();
                 ctx.arc(0, 0, maxRadius * 0.5 * p, 0, Math.PI*2);
                 ctx.fill();
             }

             // 2. Main Blast Wave (Thick, bright red)
             ctx.strokeStyle = `rgba(255, 50, 50, ${1 - p})`;
             ctx.lineWidth = 20 * (1 - p);
             ctx.shadowBlur = 20;
             ctx.shadowColor = '#f00';
             ctx.beginPath();
             ctx.arc(0, 0, maxRadius * p, 0, Math.PI * 2);
             ctx.stroke();
             
             // 3. Inner Echo Rings
             ctx.lineWidth = 2;
             ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - p) * 0.5})`;
             ctx.beginPath();
             ctx.arc(0, 0, maxRadius * p * 0.7, 0, Math.PI * 2);
             ctx.stroke();

             // 4. Debris/Sparks
             const numSparks = 12;
             for(let i=0; i<numSparks; i++) {
                 const angle = (i / numSparks) * Math.PI * 2 + (p * 2);
                 const dist = maxRadius * p * (0.8 + Math.random() * 0.4);
                 ctx.fillStyle = '#ffff00';
                 ctx.beginPath();
                 ctx.arc(Math.cos(angle)*dist, Math.sin(angle)*dist, 3 * (1-p), 0, Math.PI*2);
                 ctx.fill();
             }

        } else if (anim.type === 'railgunBeam') {
            // Note: Railgun visual preserved for potential future use or lingering effects
             if (anim.targetPosition) {
                 const dx = anim.targetPosition.x - anim.position.x;
                 const dy = anim.targetPosition.y - anim.position.y;
                 const angle = Math.atan2(dy, dx);
                 const dist = Math.hypot(dx, dy);
                 
                 ctx.save();
                 ctx.translate(anim.position.x, anim.position.y);
                 ctx.rotate(angle);
                 
                 // Main Beam
                 // Outer Glow
                 ctx.shadowBlur = 30;
                 ctx.shadowColor = anim.color || '#ef4444';
                 ctx.strokeStyle = anim.color || '#ef4444';
                 ctx.lineWidth = 15 * (1 - progress);
                 ctx.lineCap = 'round';
                 ctx.globalAlpha = 1 - progress;
                 ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(dist, 0); ctx.stroke();
                 
                 // Inner Core
                 ctx.shadowBlur = 10;
                 ctx.shadowColor = '#ffffff';
                 ctx.strokeStyle = '#ffffff';
                 ctx.lineWidth = 5 * (1 - progress);
                 ctx.globalAlpha = 1;
                 ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(dist, 0); ctx.stroke();

                 // Muzzle Flash
                 if (progress < 0.3) {
                     ctx.fillStyle = '#ffffff';
                     ctx.beginPath(); ctx.arc(0, 0, 40 * (1 - progress/0.3), 0, Math.PI*2); ctx.fill();
                 }

                 // Magnetic Rings along the path
                 if (progress < 0.5) {
                    const numRings = 5;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    for(let i=1; i<numRings; i++) {
                        const rX = (dist / numRings) * i;
                        const rSize = 10 * (1-progress) + (i*2);
                        ctx.beginPath();
                        ctx.ellipse(rX, 0, 5, rSize, 0, 0, Math.PI*2);
                        ctx.stroke();
                    }
                 }

                 ctx.restore();
             }
        } else if (anim.type === 'lightning') {
             if (anim.targetPosition) {
                 const dx = anim.targetPosition.x - anim.position.x; const dy = anim.targetPosition.y - anim.position.y; const dist = Math.hypot(dx, dy); const angle = Math.atan2(dy, dx);
                 ctx.rotate(angle); ctx.strokeStyle = anim.color || '#00F0FF'; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = anim.color || '#00F0FF'; ctx.globalAlpha = 1 - progress;
                 ctx.beginPath(); ctx.moveTo(0, 0); let cx = 0; const steps = 10; for(let i=0; i<steps; i++) { cx += dist / steps; const cy = (Math.random() - 0.5) * 20; ctx.lineTo(cx, cy); } ctx.lineTo(dist, 0); ctx.stroke();
             }
        } else if (anim.type === 'dashTrail') {
             ctx.globalAlpha = 1 - progress; ctx.fillStyle = anim.color || '#fff'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI*2); ctx.fill();
        } else if (anim.type === 'shieldHit') {
             ctx.strokeStyle = anim.color || '#06b6d4'; ctx.lineWidth = 2; ctx.globalAlpha = 1 - progress; ctx.beginPath(); ctx.arc(0, 0, 40 * progress + 30, 0, Math.PI * 2); ctx.stroke();
        } else if (anim.type === 'mortarStrike') {
             const maxR = 60; ctx.fillStyle = `rgba(239, 68, 68, ${0.5 * (1-progress)})`; ctx.beginPath(); ctx.arc(0, 0, maxR * progress, 0, Math.PI*2); ctx.fill();
             ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.globalAlpha = 1 - progress; ctx.beginPath(); ctx.arc(0, 0, maxR * progress, 0, Math.PI*2); ctx.stroke();
        } else if (anim.type === 'finalBlast') {
             const maxR = 1000; ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress})`; ctx.beginPath(); ctx.arc(0, 0, maxR * progress, 0, Math.PI*2); ctx.fill();
        } else if (anim.type === 'orbitalBeam') {
            // Vertical beam from sky
            // 1. Ground impact ring
            const maxR = 120;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 1 - progress;
            ctx.beginPath();
            ctx.arc(0, 0, maxR * progress, 0, Math.PI * 2);
            ctx.stroke();

            // 2. The Beam itself
            const beamWidth = 60 * (1 - progress); // Shrinks over time
            ctx.fillStyle = '#fff'; // Core
            ctx.shadowColor = '#00F0FF'; // Cyan tint for player, or Red for boss? True form is Red/Gold
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#fbbf24'; 
            
            // Draw beam going up infinitely
            ctx.beginPath();
            ctx.rect(-beamWidth/2, -1000, beamWidth, 1000); // 1000px up
            ctx.fill();

            // 3. Shockwave rings going up
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            const numRings = 3;
            for (let i = 0; i < numRings; i++) {
                const y = -1000 * ((progress + i * 0.3) % 1);
                ctx.beginPath();
                ctx.ellipse(0, y, beamWidth, beamWidth * 0.3, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.restore();
    });
}

export function drawPowerUp(ctx: CanvasRenderingContext2D, powerUp: PowerUp, now: number) {
    const elapsed = now - powerUp.spawnTime; const floatY = Math.sin(elapsed * 0.003) * 5; const size = 24;
    ctx.save(); ctx.translate(powerUp.position.x, powerUp.position.y + floatY); ctx.shadowBlur = 15; ctx.shadowColor = '#fff';
    const img = powerUpImages[powerUp.type];
    if (img && img.complete && img.naturalWidth > 0) { ctx.drawImage(img, -size/2, -size/2, size, size); } 
    else { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
}

export function drawEffectZones(ctx: CanvasRenderingContext2D, zones: EffectZone[], now: number) {
    zones.forEach(zone => {
        const elapsed = now - zone.createdAt; if (elapsed > zone.duration) return;
        ctx.save(); ctx.translate(zone.position.x, zone.position.y);
        if (zone.type === 'chrono') {
             ctx.fillStyle = 'rgba(139, 92, 246, 0.2)'; ctx.beginPath(); ctx.arc(0, 0, zone.radius, 0, Math.PI*2); ctx.fill();
             ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.rotate(now * 0.001); ctx.beginPath(); ctx.arc(0, 0, zone.radius, 0, Math.PI*2); ctx.stroke();
        } else if (zone.type === 'fissure') {
             // Jagged cracks with magma
             // Rotate randomly per ID seed? Just rotate by time for dynamic feel
             ctx.rotate(now * 0.0005);
             
             // Magma Glow
             const pulse = 0.5 + Math.sin(now * 0.005) * 0.3;
             ctx.shadowColor = '#f97316';
             ctx.shadowBlur = 15;
             ctx.strokeStyle = `rgba(249, 115, 22, ${pulse})`;
             ctx.lineWidth = 4;
             
             // Draw random jagged lines
             const spikes = 8;
             ctx.beginPath();
             for(let i=0; i<spikes; i++) {
                 const angle = (Math.PI * 2 / spikes) * i;
                 const rOuter = zone.radius;
                 const rInner = 0;
                 ctx.moveTo(Math.cos(angle)*rInner, Math.sin(angle)*rInner);
                 
                 // Zigzag out
                 let r = 0;
                 let a = angle;
                 while(r < rOuter) {
                     r += 20;
                     a += (Math.random() - 0.5) * 0.5;
                     ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
                 }
             }
             ctx.stroke();

             // Core Heat
             ctx.fillStyle = `rgba(185, 28, 28, ${pulse * 0.5})`;
             ctx.beginPath(); ctx.arc(0, 0, zone.radius * 0.8, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
    });
}

export function drawCutsceneOverlay(ctx: CanvasRenderingContext2D, width: number, height: number, cutscene: CutsceneState) {
    if (!cutscene.active) return;
    
    // Letterboxing
    const barHeight = height * 0.12;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, barHeight);
    ctx.fillRect(0, height - barHeight, width, barHeight);
    
    // Decorative lines
    ctx.fillStyle = '#f59e0b'; // Gold
    ctx.fillRect(0, barHeight, width, 2);
    ctx.fillRect(0, height - barHeight - 2, width, 2);

    // Dialogue
    if (cutscene.phase === 'dialogue') {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = 'bold 24px "Orbitron", sans-serif';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        
        // Speaker Name
        ctx.fillStyle = '#f59e0b';
        ctx.fillText("GOLIATH PRIME", width / 2, height - barHeight + 20);
        
        // Typed text
        ctx.font = '20px "Rajdhani", sans-serif';
        ctx.fillStyle = '#fff';
        const text = cutscene.dialogueText.substring(0, Math.floor(cutscene.dialogueIndex));
        ctx.fillText(`"${text}"`, width / 2, height - barHeight + 55);
        ctx.restore();
    }
}
