
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
    
    if (boss.status === 'spawning' && boss.spawnTime) {
        const p = Math.min(1, (now - boss.spawnTime) / SPAWN_DURATION);
        ctx.scale(p, p); ctx.globalAlpha = p;
    }

    const color = boss.color;
    const size = boss.size.width;

    ctx.rotate(degToRad(boss.angle));
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    
    // Vector Style Boss Body
    ctx.beginPath();
    ctx.moveTo(size*0.6, 0);
    ctx.lineTo(-size*0.4, size*0.5);
    ctx.lineTo(-size*0.3, 0);
    ctx.lineTo(-size*0.4, -size*0.5);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    
    // Core Glow
    ctx.fillStyle = color;
    ctx.shadowColor = color; ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

    // Turret
    ctx.rotate(degToRad(boss.turretAngle - boss.angle));
    ctx.fillStyle = color;
    ctx.fillRect(0, -4, size*0.7, 8); // Cannon

    ctx.restore();
}

export function drawTank(ctx: CanvasRenderingContext2D, tank: Tank, now: number, abilities: Ability[], isTimeStopped: boolean) {
    if (tank.status === 'dead') return;
    ctx.save();
    ctx.translate(tank.position.x, tank.position.y);
    
    if (tank.status === 'spawning' && tank.spawnTime) {
        const p = Math.min(1, (now - tank.spawnTime) / SPAWN_DURATION);
        ctx.scale(p, p); ctx.globalAlpha = p;
    }

    if (tank.lastHitTime && now - tank.lastHitTime < 100) {
        ctx.strokeStyle = 'white';
        ctx.fillStyle = 'white';
    } else {
        ctx.strokeStyle = tank.color;
        ctx.fillStyle = '#050505'; // Darker black
    }

    ctx.rotate(degToRad(tank.angle));
    ctx.lineWidth = 2;
    
    // Tactical Box Shape
    ctx.beginPath();
    ctx.rect(-15, -15, 30, 30);
    ctx.fill(); ctx.stroke();
    
    // Treads
    ctx.fillStyle = tank.color;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(-18, -18, 36, 6);
    ctx.fillRect(-18, 12, 36, 6);
    ctx.globalAlpha = 1;

    // Turret
    ctx.rotate(degToRad(tank.turretAngle - tank.angle));
    ctx.fillStyle = tank.color;
    ctx.shadowColor = tank.color; ctx.shadowBlur = 5;
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
    ctx.fillRect(0, -3, 22, 6);
    ctx.shadowBlur = 0;

    ctx.restore();
}

export function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile, owner: any, isToxic: boolean) {
    ctx.save();
    ctx.translate(proj.position.x, proj.position.y);
    ctx.rotate(degToRad(proj.angle));
    
    const color = proj.ownerId === 'player' ? '#00F0FF' : '#ef4444';
    
    ctx.fillStyle = color;
    ctx.shadowColor = color; ctx.shadowBlur = 10;
    
    // Bullet Shape
    ctx.beginPath();
    ctx.moveTo(6, 0); ctx.lineTo(-4, 3); ctx.lineTo(-4, -3);
    ctx.fill();
    
    ctx.restore();
}

export function drawTelegraphs(ctx: CanvasRenderingContext2D, telegraphs: Telegraph[], now: number) {
    telegraphs.forEach(t => {
        const progress = Math.min(1, (now - t.createdAt) / t.duration);
        ctx.save();
        ctx.translate(t.position.x, t.position.y);
        
        // Hazard Pattern
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 10; patternCanvas.height = 10;
        const pCtx = patternCanvas.getContext('2d');
        if (pCtx) {
            pCtx.fillStyle = 'rgba(239, 68, 68, 0.2)';
            pCtx.fillRect(0,0,10,10);
            pCtx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
            pCtx.beginPath(); pCtx.moveTo(0,10); pCtx.lineTo(10,0); pCtx.stroke();
        }
        const pattern = ctx.createPattern(patternCanvas, 'repeat');
        if (pattern) ctx.fillStyle = pattern;
        
        ctx.strokeStyle = '#ef4444';
        
        if (t.type === 'circle') {
            const r = t.radius || 50;
            ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); 
            ctx.fill(); ctx.stroke();
            // Shrinking inner ring
            ctx.beginPath(); ctx.arc(0, 0, r * (1-progress), 0, Math.PI*2);
            ctx.stroke();
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
        
        if (anim.type === 'explosion') {
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
        }
        ctx.restore();
    });
}

// ... Keep existing simple renderers for PowerUps, etc. ...
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
export function drawDamageNumbers(ctx: CanvasRenderingContext2D, nums: DamageNumber[], now: number) {}
export function drawMinion(ctx: CanvasRenderingContext2D, m: Minion, now: number) {}
export function drawChronoShards(ctx: CanvasRenderingContext2D, shards: any[], now: number) {}
export function drawCyberBeam(ctx: CanvasRenderingContext2D, player: Tank, target: Vector, now: number, isToxic: boolean) {}
