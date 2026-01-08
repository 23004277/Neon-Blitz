
import type { Tank, Projectile, Wall, Vector, Animation, PowerUp, Ability, Boss, Telegraph, EffectZone, DamageNumber, DamageIndicator, Minion, StatusEffect, PoisonStatusEffect } from '../../types';

export const degToRad = (d: number) => d * (Math.PI / 180);

const SPAWN_DURATION = 1000;

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
    
    // --- UPDATED BOSS SHOCKWAVE TELEGRAPH ---
    if (boss.attackState.currentAttack === 'shockwave') {
        const p = (now - boss.attackState.phaseStartTime) / 1000;
        if (boss.attackState.phase === 'telegraphing') {
            ctx.save();
            ctx.scale(1/scale, 1/scale); 
            
            // Flower of Life Pattern - Charging Up
            const maxRadius = 200;
            const chargeR = maxRadius * p; 
            const alpha = 0.3 + (Math.sin(now * 0.02) * 0.2);
            
            ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
            ctx.lineWidth = 1.5;
            
            // Apply slight rotation for charging effect
            ctx.rotate(now * 0.001);

            // Draw Central Circle
            const subR = chargeR * 0.55; 
            ctx.beginPath();
            ctx.arc(0, 0, subR, 0, Math.PI*2);
            ctx.stroke();
            
            // Draw 6 Surrounding Circles (Flower of Life)
            for(let i=0; i<6; i++) {
                const angle = (i * 60 * Math.PI / 180);
                const cx = Math.cos(angle) * (chargeR * 0.5);
                const cy = Math.sin(angle) * (chargeR * 0.5);
                
                ctx.beginPath();
                ctx.arc(cx, cy, subR, 0, Math.PI*2);
                ctx.stroke();
            }
            
            // Outer Warning Boundary
            ctx.setLineDash([15, 10]);
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 + p * 0.5})`;
            ctx.beginPath();
            ctx.arc(0, 0, maxRadius, 0, Math.PI*2);
            ctx.stroke();
            
            // Fill Inner Danger Zone
            ctx.fillStyle = `rgba(239, 68, 68, ${p * 0.15})`;
            ctx.fill();
            
            ctx.restore();
        }
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

    const isRailgun = boss.attackState.currentAttack === 'railgun';
    ctx.fillStyle = isHit ? '#fff' : (isRailgun ? '#ff0000' : '#fca5a5');
    ctx.beginPath(); ctx.arc(0, 0, isRailgun ? 10 : 8, 0, Math.PI*2); ctx.fill();
    
    if (isRailgun) {
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 10 + Math.random() * 10;
    }

    if (boss.attackState.phase === 'telegraphing') {
       const isLaser = boss.attackState.currentAttack === 'laserSweep';
       const isRailgun = boss.attackState.currentAttack === 'railgun';
       
       ctx.shadowColor = (isLaser || isRailgun) ? '#ff0000' : '#ef4444';
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
       } else if (isRailgun) {
           ctx.save();
           const elapsed = now - boss.attackState.phaseStartTime;
           const lockProgress = elapsed / 1500; 
           
           ctx.fillStyle = '#f00';
           ctx.beginPath(); ctx.arc(65, 0, 4 + lockProgress * 4, 0, Math.PI*2); ctx.fill();

           ctx.scale(1/scale, 1/scale); 
           const offset = 65 * scale;
           
           ctx.strokeStyle = lockProgress > 0.8 ? '#f00' : 'rgba(255, 0, 0, 0.5)';
           ctx.lineWidth = lockProgress > 0.8 ? 3 : 1;
           if (lockProgress < 0.8) ctx.setLineDash([10, 10]);
           
           ctx.beginPath();
           ctx.moveTo(offset, 0);
           ctx.lineTo(1200, 0); 
           ctx.stroke();
           
           ctx.restore();
       } else if (boss.attackState.currentAttack === 'mortarVolley') {
           ctx.beginPath(); ctx.arc(65, -12, 5, 0, Math.PI*2); ctx.fill();
           ctx.beginPath(); ctx.arc(65, 12, 5, 0, Math.PI*2); ctx.fill();
       }
    }
    
    if (boss.attackState.currentAttack === 'laserSweep' && boss.attackState.phase === 'attacking') {
        ctx.save();
        const flicker = Math.random() * 5;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 10 + flicker;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.moveTo(60, 0);
        ctx.lineTo(1000, 0);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 30 + flicker * 2;
        ctx.beginPath();
        ctx.moveTo(60, 0);
        ctx.lineTo(1000, 0);
        ctx.stroke();
        ctx.restore();
    }

    ctx.restore();
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
    ctx.save();
    ctx.translate(tank.position.x, tank.position.y);

    if (tank.status === 'spawning' && tank.spawnTime) {
        const p = Math.min(1, (now - tank.spawnTime) / 1000);
        ctx.scale(p, p); 
        ctx.globalAlpha = p;
    }

    const isPlayer = tank.type === 'player';
    const isHit = tank.lastHitTime && now - tank.lastHitTime < 75;
    
    const cFill = (col: string) => isHit ? '#ffffff' : col;
    const cStroke = (col: string) => isHit ? '#ffffff' : col;

    ctx.rotate(degToRad(tank.angle));

    if (isPlayer) {
        const primary = '#00F0FF';
        const dark = '#020617';

        ctx.shadowColor = isHit ? '#ffffff' : primary;
        ctx.shadowBlur = isHit ? 20 : 10;

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

        const overdrive = abilities?.find(a => a.id === 'overdrive' && a.state === 'active');
        if (overdrive && !isHit) {
             ctx.save();
             
             const gold = '#f59e0b';
             const brightGold = '#fcd34d';
             const intenseWhite = '#ffffff';

             ctx.shadowBlur = 30;
             ctx.shadowColor = brightGold;
             ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
             ctx.beginPath();
             ctx.arc(0, 0, 35, 0, Math.PI * 2);
             ctx.fill();

             ctx.shadowBlur = 20;
             ctx.shadowColor = gold;
             ctx.lineWidth = 3;
             ctx.lineJoin = 'round';
             ctx.strokeStyle = brightGold;
             ctx.fillStyle = 'rgba(251, 191, 36, 0.15)'; 

             ctx.beginPath();
             const spikes = 24;
             for(let i=0; i<=spikes; i++) {
                 const angle = (i / spikes) * Math.PI * 2 + (now * 0.005); 
                 
                 const rBase = 45;
                 const noise = Math.sin(i * 15 + now * 0.02) * 8; 
                 const breathe = Math.sin(now * 0.01) * 4;
                 const randomFlicker = Math.random() * 4;
                 
                 const r = rBase + noise + breathe + randomFlicker;
                 
                 const x = Math.cos(angle) * r;
                 const y = Math.sin(angle) * r;
                 
                 if (i===0) ctx.moveTo(x, y);
                 else ctx.lineTo(x, y);
             }
             ctx.closePath();
             ctx.stroke();
             ctx.fill();

             ctx.shadowBlur = 15;
             ctx.shadowColor = intenseWhite;
             ctx.strokeStyle = intenseWhite;
             ctx.lineWidth = 2;
             
             const numBolts = 4;
             for(let i=0; i<numBolts; i++) {
                 if (Math.random() > 0.6) continue;

                 const angle = Math.random() * Math.PI * 2;
                 const startDist = 30;
                 const length = 50 + Math.random() * 30;
                 
                 ctx.beginPath();
                 let cx = Math.cos(angle) * startDist;
                 let cy = Math.sin(angle) * startDist;
                 ctx.moveTo(cx, cy);
                 
                 const segments = 4;
                 for(let j=0; j<segments; j++) {
                     const r = startDist + (length / segments) * (j + 1);
                     const jitterAngle = angle + (Math.random() - 0.5) * 1.5; 
                     cx = Math.cos(jitterAngle) * r;
                     cy = Math.sin(jitterAngle) * r;
                     ctx.lineTo(cx, cy);
                 }
                 ctx.stroke();
             }

             ctx.fillStyle = brightGold;
             const numParticles = 8;
             for(let i=0; i<numParticles; i++) {
                 const pAngle = (i / numParticles) * Math.PI * 2 + now * 0.002;
                 const dist = 35 + (now * 0.05 + i * 10) % 40; 
                 const size = 3 * (1 - (dist - 35)/40); 
                 
                 ctx.globalAlpha = size / 3;
                 ctx.beginPath();
                 ctx.arc(Math.cos(pAngle)*dist, Math.sin(pAngle)*dist, size, 0, Math.PI*2);
                 ctx.fill();
             }
             ctx.globalAlpha = 1.0;

             ctx.restore();
        }

        ctx.rotate(degToRad(tank.turretAngle - tank.angle));
        
        ctx.fillStyle = cFill('#334155');
        ctx.fillRect(-2, -3, 32, 6);
        
        if (!isHit) {
            ctx.fillStyle = primary;
            ctx.fillRect(4, -1, 20, 2);
        }

        ctx.fillStyle = cFill(dark);
        ctx.strokeStyle = cStroke(primary);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();

    } else {
        const primary = tank.color || '#f97316';
        const dark = '#1c1917'; 
        const metal = '#44403c';

        ctx.shadowColor = isHit ? '#ffffff' : primary;
        ctx.shadowBlur = isHit ? 20 : 5;

        if (tank.tier === 'intermediate') {
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
            ctx.fillStyle = cFill(primary);
            ctx.fillRect(26, -6, 4, 12);
            
            ctx.fillStyle = cFill(dark);
            ctx.strokeStyle = cStroke(primary);
            ctx.fillRect(-10, -10, 20, 20);
            ctx.strokeRect(-10, -10, 20, 20);
            
            if (!isHit) {
                ctx.fillStyle = primary;
                ctx.fillRect(2, -8, 4, 4);
            }

        } else {
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

            ctx.fillStyle = cFill('#292524');
            ctx.fillRect(0, -3, 22, 6); 

            if (!isHit) {
                ctx.fillStyle = primary;
                ctx.fillRect(8, -1, 10, 2); 
            }
            
            ctx.fillStyle = cFill(primary);
            ctx.fillRect(20, -2, 4, 4);
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
    }

    ctx.restore();
}

export function drawCyberBeam(ctx: CanvasRenderingContext2D, player: Tank, target: Vector, now: number, state: 'charging' | 'active', startTime: number, chargeDuration: number = 1500, isOverdrive: boolean = false) {
    const elapsed = now - startTime;
    const turretLen = 28; 
    const rad = degToRad(player.turretAngle);
    const tipX = player.position.x + Math.cos(rad) * turretLen;
    const tipY = player.position.y + Math.sin(rad) * turretLen;

    const colors = isOverdrive ? {
        core: '#ffffff',
        inner: '#fbbf24', 
        outer: 'rgba(245, 158, 11, 0.2)', 
        glow: '#f59e0b',
        spark: '#ef4444' 
    } : {
        core: '#ffffff',
        inner: 'rgba(0, 240, 255, 0.8)', 
        outer: 'rgba(6, 182, 212, 0.2)',
        glow: '#06b6d4',
        spark: '#d946ef' 
    };

    if (state === 'charging') {
        const p = Math.min(1, elapsed / chargeDuration);
        
        ctx.save();
        ctx.translate(tipX, tipY);
        
        const baseRadius = 2 + (p * 12);
        const pulse = Math.sin(now * 0.05) * 2;
        const radius = baseRadius + Math.max(0, pulse);

        ctx.fillStyle = colors.core;
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 10 + (p * 20);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI*2);
        ctx.fill();

        ctx.strokeStyle = isOverdrive ? `rgba(251, 191, 36, ${0.5 + p * 0.5})` : `rgba(0, 240, 255, ${0.5 + p * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.5, 0, Math.PI*2);
        ctx.stroke();

        if (p > 0.3) {
            const numSparks = Math.floor(p * (isOverdrive ? 8 : 5));
            ctx.fillStyle = colors.spark;
            for (let i = 0; i < numSparks; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = radius + Math.random() * 10;
                ctx.beginPath();
                ctx.arc(Math.cos(angle)*dist, Math.sin(angle)*dist, isOverdrive ? 2 : 1.5, 0, Math.PI*2);
                ctx.fill();
            }
        }

        ctx.restore();
    } 
    else if (state === 'active') {
        const endX = target.x;
        const endY = target.y;

        const pulse = Math.sin(now * 0.05) * 5;

        ctx.save();
        ctx.lineCap = 'round';
        
        ctx.strokeStyle = colors.outer; 
        ctx.lineWidth = (isOverdrive ? 60 : 40) + pulse;
        ctx.shadowBlur = isOverdrive ? 30 : 20;
        ctx.shadowColor = colors.glow;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.strokeStyle = colors.inner;
        ctx.lineWidth = (isOverdrive ? 25 : 15) + (pulse * 0.5);
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.strokeStyle = colors.core;
        ctx.lineWidth = isOverdrive ? 8 : 4;
        ctx.shadowBlur = 5;
        ctx.shadowColor = colors.core;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.strokeStyle = colors.spark; 
        ctx.lineWidth = isOverdrive ? 3 : 2;
        ctx.beginPath();
        const dist = Math.hypot(endX - tipX, endY - tipY);
        const steps = Math.max(5, Math.floor(dist / 30));
        
        ctx.moveTo(tipX, tipY);
        
        for(let i=0; i<steps; i++) {
            const t = (i+1)/steps;
            const tx = tipX + (endX - tipX) * t;
            const ty = tipY + (endY - tipY) * t;
            
            const angle = Math.atan2(endY - tipY, endX - tipX);
            const perpX = -Math.sin(angle);
            const perpY = Math.cos(angle);
            const jitter = (Math.random() - 0.5) * (isOverdrive ? 50 : 30);
            
            ctx.lineTo(tx + perpX * jitter, ty + perpY * jitter);
        }
        ctx.stroke();

        ctx.restore();
    }
}

export function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile, owner: any, isToxic: boolean) {
    ctx.save();
    
    // Position
    ctx.translate(proj.position.x, proj.position.y);
    ctx.rotate(degToRad(proj.angle));
    
    // Determine colors
    const isPlayer = proj.ownerId === 'player';
    const coreColor = '#ffffff';
    const glowColor = proj.color || (isPlayer ? '#00F0FF' : '#ef4444');
    
    // --- SPECIAL RENDER FOR HOMING MISSILES ---
    if (proj.isHoming) {
        ctx.scale(1.2, 1.2);
        // Smoke Trail
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-25, 0);
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)'; // Smoke color
        ctx.stroke();

        // Rocket Body
        ctx.fillStyle = '#ef4444'; // Red tip
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(0, -3);
        ctx.lineTo(-6, -3);
        ctx.lineTo(-6, 3);
        ctx.lineTo(0, 3);
        ctx.closePath();
        ctx.fill();

        // Fins
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.moveTo(-6, -3);
        ctx.lineTo(-10, -5);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-10, 5);
        ctx.lineTo(-6, 3);
        ctx.fill();

        // Engine Glow
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(-8, 0, 2, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
        return; // Skip default rendering
    }

    // Default Projectile Rendering
    // Set Shadow for Glow Effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = glowColor;
    
    // Pulse effect
    const pulse = 1 + Math.sin(Date.now() * 0.02) * 0.1;
    ctx.scale(pulse, pulse);

    // 1. Trail (Fading tail)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Draw trail tapering back
    ctx.lineTo(-20, 0); 
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = glowColor;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    
    // Reset Alpha for Core
    ctx.globalAlpha = 1.0;

    // 2. Main Energy Bolt (Capsule Shape)
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    // Use an elongated ellipse/capsule
    ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 3. Outer Halo
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

export function drawDamageNumbers(ctx: CanvasRenderingContext2D, nums: DamageNumber[], now: number) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    nums.forEach(num => {
        const elapsed = now - num.createdAt;
        if (elapsed > num.duration) return;

        const progress = elapsed / num.duration;
        
        // Motion: Pop up fast, then float up slowly
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const yOffset = easeOut * 45; 
        
        // Scale: Elastic pop in
        let scale = 1;
        if (progress < 0.15) {
            scale = progress / 0.15; // 0 to 1
        } else if (progress < 0.3) {
            scale = 1 + (0.3 - progress) * 0.5; // Bounce to 1.075
        } else {
            scale = 1;
        }
        
        // Fade out at end
        const alpha = progress > 0.7 ? 1 - ((progress - 0.7) / 0.3) : 1;
        
        ctx.save();
        ctx.translate(num.position.x, num.position.y - yOffset);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;
        
        // Determine style based on value/text
        const val = parseInt(num.text);
        // Assuming base dmg is ~2, hits > 3 are high damage (crits/overdrive)
        const isCrit = !isNaN(val) && val >= 4; 
        const isHeal = num.text === 'REPAIR';
        
        ctx.font = (isCrit || isHeal) 
            ? '900 24px "Orbitron", sans-serif' 
            : 'bold 16px "Orbitron", sans-serif';
        
        // Strong Glow/Shadow
        ctx.shadowColor = num.color;
        ctx.shadowBlur = isCrit ? 20 : 8;
        
        // Outline for legibility
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.strokeText(num.text, 0, 0);
        
        // Fill
        ctx.fillStyle = num.color;
        ctx.fillText(num.text, 0, 0);
        
        // Extra white core for crits
        if (isCrit) {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = alpha * 0.7;
            ctx.fillText(num.text, 0, 0);
        }
        
        ctx.restore();
    });
    
    ctx.restore();
}

export function drawTelegraphs(ctx: CanvasRenderingContext2D, telegraphs: Telegraph[], now: number) {
    telegraphs.forEach(t => {
        const progress = Math.min(1, (now - t.createdAt) / t.duration);
        ctx.save();
        ctx.translate(t.position.x, t.position.y);
        
        // Pulsing Effect
        const pulse = 0.5 + Math.sin(now * 0.01) * 0.2;
        
        // Hazard Pattern
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 10; patternCanvas.height = 10;
        const pCtx = patternCanvas.getContext('2d');
        if (pCtx) {
            pCtx.fillStyle = `rgba(239, 68, 68, ${0.1 * pulse})`;
            pCtx.fillRect(0,0,10,10);
            pCtx.strokeStyle = `rgba(239, 68, 68, ${0.4 * pulse})`;
            pCtx.beginPath(); pCtx.moveTo(0,10); pCtx.lineTo(10,0); pCtx.stroke();
        }
        const pattern = ctx.createPattern(patternCanvas, 'repeat');
        if (pattern) ctx.fillStyle = pattern;
        
        ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
        ctx.lineWidth = 2;
        
        if (t.type === 'circle') {
            const r = t.radius || 50;
            ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); 
            ctx.fill(); ctx.stroke();
            // Shrinking inner ring
            ctx.beginPath(); ctx.arc(0, 0, r * (1-progress), 0, Math.PI*2);
            ctx.strokeStyle = '#ffaaaa';
            ctx.stroke();
        }

        // --- NEW: Detailed Mine Visual ---
        if (t.id.includes('mine')) {
             // 1. Shadow underneath
             ctx.fillStyle = 'rgba(0,0,0,0.5)';
             ctx.beginPath(); ctx.arc(0, 5, 12, 0, Math.PI*2); ctx.fill();

             // 2. Mine Body (Pop in effect)
             const scale = Math.min(1, progress * 4); // Pop in quickly
             ctx.scale(scale, scale);

             // Spin effect for arming
             ctx.rotate(now * 0.005);

             // Spiked Casing
             ctx.fillStyle = '#1f2937'; // Dark gray
             ctx.beginPath();
             const spikes = 6;
             for(let i=0; i<spikes * 2; i++) {
                 const r = i % 2 === 0 ? 14 : 8;
                 const a = (i / (spikes * 2)) * Math.PI * 2;
                 ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
             }
             ctx.closePath();
             ctx.fill();
             ctx.strokeStyle = '#f97316'; // Orange outline
             ctx.lineWidth = 1.5;
             ctx.stroke();

             // 3. Arming Light (Center)
             // Blink faster as it gets closer to detonation
             const blinkSpeed = progress > 0.7 ? 25 : 4;
             const blink = Math.sin(now * 0.001 * blinkSpeed) > 0;

             ctx.fillStyle = blink ? '#ff0000' : '#450a0a';
             ctx.shadowColor = '#ff0000';
             ctx.shadowBlur = blink ? 15 : 0;
             ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
             
             // 4. Scanning Ring (Optional tech look)
             if (progress > 0.4) {
                 ctx.strokeStyle = `rgba(255, 0, 0, ${0.5})`;
                 ctx.lineWidth = 1;
                 ctx.beginPath();
                 ctx.arc(0, 0, 20 * progress, 0, Math.PI*2); // Expanding scan ring
                 ctx.stroke();
             }
        }
        
        ctx.restore();
    });
}

export function drawAnimations(ctx: CanvasRenderingContext2D, anims: Animation[], now: number) {
    anims.forEach(anim => {
        const progress = (now - anim.createdAt) / anim.duration;
        if (progress > 1) return;

        ctx.save();
        ctx.translate(anim.position.x, anim.position.y);
        
        if (anim.type === 'finalBlast') {
            if (progress < 0.1) {
                const flashOpacity = 1 - (progress / 0.1);
                ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
                ctx.fillRect(-1000, -1000, 2000, 2000); 
            }
            const maxRadius = 400;
            const currentRadius = maxRadius * Math.pow(progress, 0.5); 
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            gradient.addColorStop(0.4, 'rgba(255, 200, 0, 0.5)'); 
            gradient.addColorStop(0.8, 'rgba(255, 50, 0, 0.8)'); 
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)'); 

            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
            ctx.fill();

            if (progress > 0.1) {
                const shockProgress = (progress - 0.1) / 0.9;
                const r = maxRadius * 1.2 * shockProgress;
                ctx.strokeStyle = `rgba(200, 200, 255, ${1 - shockProgress})`;
                ctx.lineWidth = 10 * (1 - shockProgress);
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.stroke();
                
                const r2 = maxRadius * 0.8 * shockProgress;
                ctx.strokeStyle = `rgba(255, 100, 100, ${1 - shockProgress})`;
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(0, 0, r2, 0, Math.PI * 2);
                ctx.stroke();
            }

            const numSpikes = 20;
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 3;
            for (let i = 0; i < numSpikes; i++) {
                const angle = (i / numSpikes) * Math.PI * 2 + (now * 0.001);
                const spikeDist = 50 + (progress * 600);
                const spikeLen = 40 * (1 - progress);
                
                if (progress < 0.8) {
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle) * spikeDist, Math.sin(angle) * spikeDist);
                    ctx.lineTo(Math.cos(angle) * (spikeDist + spikeLen), Math.sin(angle) * (spikeDist + spikeLen));
                    ctx.stroke();
                }
            }
            ctx.globalCompositeOperation = 'source-over'; 

        } else if (anim.type === 'shockwave') {
            const maxR = anim.width || 150;
            const easeOut = 1 - Math.pow(1 - progress, 3); // Fast out, slow end
            const r = maxR * easeOut;
            const alpha = 1 - progress;
            
            // 1. Main Blast Ring
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ef4444';
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 15 * (1 - progress);
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI*2);
            ctx.stroke();
            
            // 2. Flower of Life Pattern (Cyber Mandala Explosion)
            ctx.save();
            ctx.rotate(progress * Math.PI); // Rotate as it expands
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.8})`; 
            ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.15})`;
            
            const subR = r * 0.55; 
            
            // Center Circle
            ctx.beginPath();
            ctx.arc(0, 0, subR, 0, Math.PI*2);
            ctx.stroke();
            ctx.fill();
            
            // 6 Surrounding Circles
            for(let i=0; i<6; i++) {
                const angle = (i * 60) * (Math.PI / 180);
                const cx = Math.cos(angle) * (r * 0.5); // Offset from center
                const cy = Math.sin(angle) * (r * 0.5);
                
                ctx.beginPath();
                ctx.arc(cx, cy, subR, 0, Math.PI*2);
                ctx.stroke();
                ctx.fill();
            }
            
            ctx.restore();

            // 3. Shockwave Distortion Lines (Digital cracks)
            ctx.shadowBlur = 0;
            ctx.strokeStyle = `rgba(252, 165, 165, ${alpha})`; // Light red
            ctx.lineWidth = 2;
            const numLines = 12;
            for(let i=0; i<numLines; i++) {
                const angle = (i / numLines) * Math.PI * 2 + (progress * 2);
                const startR = r * 0.8;
                const endR = r * 1.2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle)*startR, Math.sin(angle)*startR);
                ctx.lineTo(Math.cos(angle)*endR, Math.sin(angle)*endR);
                ctx.stroke();
            }

        } else if (anim.type === 'railgunBeam') {
            const end = anim.targetPosition || {x: 0, y: 0};
            const dx = end.x - anim.position.x;
            const dy = end.y - anim.position.y;
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = `rgba(255, 255, 255, ${1-progress})`;
            ctx.lineWidth = 6 * (1-progress);
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.lineTo(dx, dy);
            ctx.stroke();
            ctx.strokeStyle = `rgba(255, 0, 0, ${(1-progress)*0.5})`;
            ctx.lineWidth = 15 * (1-progress);
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.lineTo(dx, dy);
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';

        } else if (anim.type === 'mineExplosion') {
            const count = 12;
            
            ctx.fillStyle = '#f97316'; 
            for(let i=0; i<count; i++) {
                const angle = (Math.PI * 2 / count) * i + (now * 0.002);
                const dist = 10 + (80 * progress);
                const size = 5 * (1 - progress);

                ctx.save();
                ctx.translate(Math.cos(angle)*dist, Math.sin(angle)*dist);
                ctx.rotate(angle + progress * 5); 
                ctx.beginPath();
                ctx.rect(-size/2, -size/2, size, size);
                ctx.fill();
                ctx.restore();
            }

            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = `rgba(255, 80, 0, ${1-progress})`;
            ctx.beginPath(); 
            ctx.arc(0, 0, 40 * progress, 0, Math.PI*2); 
            ctx.fill();
            
            ctx.strokeStyle = `rgba(255, 200, 0, ${1-progress})`;
            ctx.lineWidth = 3 * (1-progress);
            ctx.beginPath();
            ctx.arc(0, 0, 60 * progress, 0, Math.PI*2);
            ctx.stroke();

            ctx.globalCompositeOperation = 'source-over';

        } else if (anim.type === 'explosion') {
            const count = 8;
            ctx.strokeStyle = anim.color || '#ef4444';
            ctx.lineWidth = 2;
            for(let i=0; i<count; i++) {
                const angle = (Math.PI * 2 / count) * i;
                const dist = 30 * progress;
                const len = 10 * (1-progress);
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle)*dist, Math.sin(angle)*dist);
                ctx.lineTo(Math.cos(angle)*(dist+len), Math.sin(angle)*(dist+len));
                ctx.stroke();
            }
        } else if (anim.type === 'mortarStrike') {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 4 * (1-progress);
            ctx.beginPath();
            ctx.arc(0, 0, 80 * progress, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#ef4444';
            ctx.globalAlpha = 1 - progress;
            ctx.beginPath();
            ctx.arc(0, 0, 60 * progress, 0, Math.PI * 2);
            ctx.fill();
            if (progress < 0.2) {
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 1 - (progress * 5);
                ctx.beginPath();
                ctx.arc(0, 0, 40, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.strokeStyle = '#fca5a5';
            ctx.globalAlpha = 1 - progress;
            const debrisCount = 12;
            for(let i=0; i<debrisCount; i++) {
                const angle = (Math.PI * 2 / debrisCount) * i;
                const dist = 20 + (80 * progress);
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle)*dist, Math.sin(angle)*dist);
                ctx.lineTo(Math.cos(angle)*(dist+15), Math.sin(angle)*(dist+15));
                ctx.stroke();
            }
        }
        ctx.restore();
    });
}

export function drawPowerUp(ctx: CanvasRenderingContext2D, p: PowerUp, now: number) {
    ctx.save();
    ctx.translate(p.position.x, p.position.y);
    const color = p.type === 'shield' ? '#06b6d4' : '#eab308';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -10, 20, 20);
    ctx.fillStyle = color;
    ctx.font = '12px monospace';
    ctx.fillText(p.type.charAt(0).toUpperCase(), -4, 4);
    ctx.restore();
}

export function drawEffectZones(ctx: CanvasRenderingContext2D, zones: EffectZone[], now: number) {
    zones.forEach(z => {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.arc(z.position.x, z.position.y, z.radius, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
    });
}

export function drawBarrageReticle(ctx: CanvasRenderingContext2D, pos: Vector, r: number, now: number) {}
export function drawChronoReticle(ctx: CanvasRenderingContext2D, pos: Vector, r: number, now: number) {}
export function drawBarrageWarning(ctx: CanvasRenderingContext2D, pos: Vector, r: number, p: number, now: number) {}
export function drawBossLaser(ctx: CanvasRenderingContext2D, boss: Boss, now: number) {}
export function drawTimeStopOverlay(ctx: CanvasRenderingContext2D) {}
export function drawMinion(ctx: CanvasRenderingContext2D, m: Minion, now: number) {}
export function drawChronoShards(ctx: CanvasRenderingContext2D, shards: any[], now: number) {}
