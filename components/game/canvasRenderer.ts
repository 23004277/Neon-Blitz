import type { Tank, Projectile, Wall, Vector, Animation, PowerUp, Ability, Boss, Telegraph, EffectZone, DamageNumber, DamageIndicator, Minion, StatusEffect } from '../../types';

export const degToRad = (d: number) => d * (Math.PI / 180);

const HIT_FLASH_DURATION = 150;
const SPAWN_DURATION = 1000;
const SHIELD_MAX_HEALTH = 3;
const CYBER_BEAM_CHARGE_TIME = 4000; // Keep in sync with GameScreen.tsx
const LAST_STAND_RADIUS = 500;
const TIME_STOP_CHARGE_DURATION = 2000; // Keep in sync with GameScreen.tsx
const MINION_SPAWN_DURATION = 1500; // Keep in sync with GameScreen.tsx

const drawBeamInstance = (ctx: CanvasRenderingContext2D, muzzlePos: Vector, beamEndPos: Vector, now: number, isDual: boolean, isToxic: boolean) => {
  const pulseIntensity = 0.8 + Math.sin(now / 50) * 0.2;
  const widthModifier = isDual ? 0.65 : 1.0;

  const beamColors = isToxic
    ? {
        outer: `rgba(132, 204, 22, ${0.15 * pulseIntensity})`, // lime-500
        mid: `rgba(163, 230, 53, ${0.5 * pulseIntensity})`, // lime-400
        core: '#d9f99d', // lime-200
        shadow: '#84cc16', // lime-500
        muzzle: {
          c1: 'rgba(217, 249, 157, 0.9)', // lime-200
          c2: 'rgba(132, 204, 22, 0.6)', // lime-500
          c3: 'rgba(132, 204, 22, 0)'
        }
      }
    : {
        outer: `rgba(0, 255, 255, ${0.15 * pulseIntensity})`,
        mid: `rgba(150, 255, 255, ${0.5 * pulseIntensity})`,
        core: '#ffffff',
        shadow: '#06b6d4',
        muzzle: {
          c1: 'rgba(255, 255, 255, 0.9)',
          c2: 'rgba(6, 182, 212, 0.6)',
          c3: 'rgba(6, 182, 212, 0)'
        }
      };

  // 1. Outer energy field
  ctx.beginPath();
  ctx.moveTo(muzzlePos.x, muzzlePos.y);
  ctx.lineTo(beamEndPos.x, beamEndPos.y);
  ctx.strokeStyle = beamColors.outer;
  ctx.lineWidth = 35 * widthModifier;
  ctx.lineCap = 'round';
  ctx.shadowColor = beamColors.shadow;
  ctx.shadowBlur = 30;
  ctx.stroke();

  // 2. Mid-layer energy
  ctx.beginPath();
  ctx.moveTo(muzzlePos.x, muzzlePos.y);
  ctx.lineTo(beamEndPos.x, beamEndPos.y);
  ctx.strokeStyle = beamColors.mid;
  ctx.lineWidth = 18 * widthModifier;
  ctx.lineCap = 'round';
  ctx.shadowBlur = 20;
  ctx.stroke();

  // 3. Core beam
  ctx.beginPath();
  ctx.moveTo(muzzlePos.x, muzzlePos.y);
  ctx.lineTo(beamEndPos.x, beamEndPos.y);
  ctx.strokeStyle = beamColors.core;
  ctx.lineWidth = 6 * widthModifier;
  ctx.lineCap = 'round';
  ctx.shadowBlur = 10;
  ctx.shadowColor = beamColors.core;
  ctx.stroke();

  // 4. Crackling lightning effect
  const beamVector = { x: beamEndPos.x - muzzlePos.x, y: beamEndPos.y - muzzlePos.y };
  const beamLength = Math.hypot(beamVector.x, beamVector.y);
  const perpVector = { x: -beamVector.y / beamLength, y: beamVector.x / beamLength };

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * pulseIntensity})`;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = beamColors.core;
  ctx.shadowBlur = 15;

  for (let i = 0; i < 2; i++) { // Two lightning bolts
      ctx.beginPath();
      ctx.moveTo(muzzlePos.x, muzzlePos.y);
      const segments = 10;
      for (let j = 1; j < segments; j++) {
          const progress = j / segments;
          const alongBeam = {
              x: muzzlePos.x + beamVector.x * progress,
              y: muzzlePos.y + beamVector.y * progress,
          };
          // Use a seeded random for consistency between frames
          const randomOffset = (Math.sin(now / 20 + j * 2 + i * 3) * 0.5 + 0.5) * 20 * widthModifier - (10 * widthModifier);
          const lightningPoint = {
              x: alongBeam.x + perpVector.x * randomOffset,
              y: alongBeam.y + perpVector.y * randomOffset,
          };
          ctx.lineTo(lightningPoint.x, lightningPoint.y);
      }
      ctx.lineTo(beamEndPos.x, beamEndPos.y);
      ctx.stroke();
  }
  ctx.restore();
  
  // 5. Muzzle flash effect
  const muzzleFlashRadius = (20 + Math.sin(now / 60) * 5) * widthModifier;
  const muzzleGradient = ctx.createRadialGradient(
    muzzlePos.x, muzzlePos.y, 0,
    muzzlePos.x, muzzlePos.y, muzzleFlashRadius
  );
  muzzleGradient.addColorStop(0, beamColors.muzzle.c1);
  muzzleGradient.addColorStop(0.4, beamColors.muzzle.c2);
  muzzleGradient.addColorStop(1, beamColors.muzzle.c3);
  
  ctx.fillStyle = muzzleGradient;
  ctx.beginPath();
  ctx.arc(muzzlePos.x, muzzlePos.y, muzzleFlashRadius, 0, Math.PI * 2);
  ctx.fill();
};

const drawBeamImpact = (ctx: CanvasRenderingContext2D, beamEndPos: Vector, now: number, isDual: boolean, isToxic: boolean) => {
    const impactPulse = 1 + Math.sin(now / 50) * 0.3;
    const radiusModifier = isDual ? 1.5 : 1.0;
    const impactRadius = 25 * impactPulse * radiusModifier;

    const impactGradient = ctx.createRadialGradient(
        beamEndPos.x, beamEndPos.y, 0,
        beamEndPos.x, beamEndPos.y, impactRadius
    );
    
    if (isToxic) {
        impactGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        impactGradient.addColorStop(0.3, 'rgba(132, 204, 22, 0.8)'); // lime-500
        impactGradient.addColorStop(1, 'rgba(132, 204, 22, 0)');
    } else {
        impactGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        impactGradient.addColorStop(0.3, 'rgba(6, 182, 212, 0.8)');
        impactGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
    }

    ctx.fillStyle = impactGradient;
    ctx.beginPath();
    ctx.arc(beamEndPos.x, beamEndPos.y, impactRadius, 0, Math.PI * 2);
    ctx.fill();
}


export function drawCyberBeam(ctx: CanvasRenderingContext2D, tankData: Tank, cyberBeamTarget: Vector | null, now: number, isToxic: boolean) {
  if (!cyberBeamTarget) {
    return;
  }

  ctx.save();

  const { position, turretAngle, size, activePowerUp } = tankData;
  const barrelLength = size.height / 1.6;
  const beamEndPos = cyberBeamTarget;
  const rad = degToRad(turretAngle - 90);
  
  if (activePowerUp === 'dualCannon') {
      const perpRad = rad + Math.PI / 2;
      const offset = size.width * 0.15;
      const muzzlePos1 = { 
          x: position.x + Math.cos(rad) * barrelLength + Math.cos(perpRad) * offset, 
          y: position.y + Math.sin(rad) * barrelLength + Math.sin(perpRad) * offset 
      };
      const muzzlePos2 = { 
          x: position.x + Math.cos(rad) * barrelLength - Math.cos(perpRad) * offset, 
          y: position.y + Math.sin(rad) * barrelLength - Math.sin(perpRad) * offset 
      };
      drawBeamInstance(ctx, muzzlePos1, beamEndPos, now, true, isToxic);
      drawBeamInstance(ctx, muzzlePos2, beamEndPos, now, true, isToxic);
      drawBeamImpact(ctx, beamEndPos, now, true, isToxic);
  } else {
      const muzzlePos = {
          x: position.x + Math.cos(rad) * barrelLength,
          y: position.y + Math.sin(rad) * barrelLength
      };
      drawBeamInstance(ctx, muzzlePos, beamEndPos, now, false, isToxic);
      drawBeamImpact(ctx, beamEndPos, now, false, isToxic);
  }

  ctx.restore();
}

function drawStunEffect(ctx: CanvasRenderingContext2D, now: number, effect: StatusEffect, size: {width: number, height: number}) {
    if (effect.type !== 'stun') return;
    const stunProgress = (now - effect.startTime) / effect.duration;
    const alpha = Math.sin((1-stunProgress) * Math.PI) * 0.8; // fade in/out
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#fef08a'; // yellow-200
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#facc15'; // yellow-400
    ctx.shadowBlur = 15;

    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const startAngle = (now / 80 + i * (Math.PI * 2 / 3));
        ctx.arc(0, 0, size.height * 0.6, startAngle, startAngle + Math.PI / 2);
        ctx.stroke();
    }
    ctx.restore();
}


// FIX: Renamed the 'tank' parameter to 'tankData' to resolve a "Duplicate identifier 'tank'" error.
export function drawTank(ctx: CanvasRenderingContext2D, tankData: Tank, now: number, abilities: Ability[], isTimeStopped: boolean) {
  const { position, angle, turretAngle, size, color, status, spawnTime, lastHitTime, shieldHealth, activePowerUp, isInvulnerable, tier, statusEffects } = tankData;

  const overdrive = abilities.find(a => a.id === 'overdrive');
  const cyberBeam = abilities.find(a => a.id === 'cyberBeam');
  const isAimingBarrage = abilities.find(a => a.state === 'active' && (a.id === 'barrage' || a.id === 'chronoBubble')); // A bit of a hack
  const timeStop = abilities.find(a => a.id === 'timeStop');

  ctx.save();
  ctx.translate(position.x, position.y);
  
  // Draw Overdrive Effect
  if (overdrive?.state === 'active') {
    if (overdrive.mastered) {
        // Draw mastered effect
        const baseRadius = size.height * 0.75;
        const pulse = Math.sin(now / 50) * 5;
        const radius = baseRadius + pulse;
        
        // Outer magenta glow
        ctx.save();
        ctx.strokeStyle = 'rgba(240, 0, 184, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#F000B8';
        ctx.shadowBlur = 20;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            const startAngle = -(now / 120 + i * (Math.PI * 2 / 5));
            ctx.arc(0, 0, radius, startAngle, startAngle - Math.PI / 3);
            ctx.stroke();
        }
        ctx.restore();

        // Inner cyan arcs (original effect, but brighter)
        ctx.save();
        ctx.strokeStyle = 'rgba(165, 243, 252, 1)'; // Lighter cyan
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00E0FF';
        ctx.shadowBlur = 25;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            const startAngle = (now / 150 + i * (Math.PI * 2 / 4));
            ctx.arc(0, 0, radius * 0.9, startAngle, startAngle + Math.PI / 4);
            ctx.stroke();
        }
        ctx.restore();
    } else {
      const baseRadius = size.height * 0.7;
      const pulse = Math.sin(now / 60) * 4;
      const radius = baseRadius + pulse;
      
      ctx.save();
      ctx.strokeStyle = 'rgba(107, 237, 255, 0.9)'; // Lighter cyan
      ctx.lineWidth = 2;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      
      for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          const startAngle = (now / 150 + i * (Math.PI * 2 / 4)) % (Math.PI * 2);
          ctx.arc(0, 0, radius, startAngle, startAngle + Math.PI / 4);
          ctx.stroke();
      }
      ctx.restore();
    }
  }
   // Draw Life Leech Effect
   if (activePowerUp === 'lifeLeech') {
    const radius = size.height * 0.7;
    ctx.save();
    ctx.strokeStyle = `rgba(192, 132, 252, ${0.5 + Math.sin(now / 100) * 0.3})`; // violet-400
    ctx.lineWidth = 2;
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 15;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const startAngle = -(now / 200 + i * (Math.PI * 2 / 3));
        ctx.arc(0, 0, radius + Math.sin(now/150 + i) * 3, startAngle, startAngle - Math.PI / 1.5);
        ctx.stroke();
    }
    ctx.restore();
  }
    // Draw Reflector Field Effect
    if (activePowerUp === 'reflectorField') {
    const radius = size.height * 0.75;
    const pulse = 1 + Math.sin(now/120) * 0.05;
    ctx.save();
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = `rgba(220, 220, 255, ${0.8 + Math.sin(now / 80) * 0.2})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 20;
    
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = degToRad(60 * i - 30 + (now / 50));
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  // Draw Time Stop Charging Effect
  if (timeStop?.state === 'chargingHold' && timeStop.chargeStartTime && timeStop.chargeDuration) {
    const chargeProgress = Math.min(1, (now - timeStop.chargeStartTime) / timeStop.chargeDuration);
    const easedProgress = chargeProgress * chargeProgress;
    const radius = size.height * 0.7 + 10 * easedProgress;

    // White glow
    const glowGradient = ctx.createRadialGradient(0,0,0,0,0, radius * 1.5);
    glowGradient.addColorStop(0, `rgba(255, 255, 255, ${0.6 * easedProgress})`);
    glowGradient.addColorStop(0.7, `rgba(200, 220, 255, ${0.2 * easedProgress})`);
    glowGradient.addColorStop(1, 'rgba(200, 220, 255, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath(); ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2); ctx.fill();

    // Blue lightning
    ctx.strokeStyle = `rgba(147, 197, 253, ${0.8 * easedProgress})`; // blue-300
    ctx.lineWidth = 1.5; ctx.shadowColor = '#93c5fd'; ctx.shadowBlur = 15;
    for(let i=0; i < 5; i++) {
      ctx.beginPath();
      const startAngle = (i * 72 + now/10) % 360;
      ctx.moveTo(Math.cos(degToRad(startAngle)) * radius, Math.sin(degToRad(startAngle)) * radius);
      for(let j=0; j < 4; j++) {
        const segAngle = startAngle + j * 5;
        const segRadius = radius * (1 - j * 0.1) + Math.random() * 8 - 4;
        ctx.lineTo(Math.cos(degToRad(segAngle)) * segRadius, Math.sin(degToRad(segAngle)) * segRadius);
      }
      ctx.stroke();
    }

    // Clock glyphs
    ctx.font = `bold ${10 + 10 * easedProgress}px Orbitron`; ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * easedProgress})`;
    const glyphRadius = size.height * 0.6;
    for(let i=0; i<8; i++) {
      const angle = degToRad(i * 45 + (now / 5) * (i % 2 === 0 ? 1 : -1) * easedProgress);
      ctx.save();
      ctx.translate(Math.cos(angle) * glyphRadius, Math.sin(angle) * glyphRadius);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillText(`${(i*3) % 12 || 12}`, 0, 0);
      ctx.restore();
    }
    ctx.shadowBlur = 0;
  }

  // Draw Invulnerability Effect (but not for barrage charging)
  if (isInvulnerable && !isAimingBarrage) {
    const baseRadius = size.height * 0.75;
    const pulse = Math.sin(now / 80) * 5;
    const radius = baseRadius + pulse;
    
    ctx.save();
    // Pulsing glow
    const glowGradient = ctx.createRadialGradient(0, 0, radius * 0.7, 0, 0, radius);
    glowGradient.addColorStop(0, 'rgba(139, 92, 246, 0)'); // violet-500 transparent
    glowGradient.addColorStop(0.8, 'rgba(139, 92, 246, 0.4)');
    glowGradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Crackling energy arcs
    ctx.strokeStyle = 'rgba(224, 204, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#a78bfa'; // violet-400
    ctx.shadowBlur = 10;
    
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const startAngle = (now / 200 + i * (Math.PI * 2 / 3)) % (Math.PI * 2);
        ctx.arc(0, 0, radius - 2, startAngle, startAngle + Math.PI / 3);
        ctx.stroke();
    }
    ctx.restore();
  }
  
  // Draw Shield
  if (shieldHealth && shieldHealth > 0) {
    const shieldOpacity = 0.2 + (shieldHealth / SHIELD_MAX_HEALTH) * 0.4;
    const flicker = Math.sin(now / 100) * 0.05;
    ctx.fillStyle = `${color}${Math.floor((shieldOpacity + flicker) * 255).toString(16).padStart(2, '0')}`;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 + Math.sin(now / 150);
    ctx.beginPath();
    ctx.arc(0, 0, size.height * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // --- NEW SPAWN EFFECT ---
  if (status === 'spawning' && spawnTime) {
    const spawnProgress = Math.min(1, (now - spawnTime) / SPAWN_DURATION);
    const easeIn = (t: number) => t * t;
    
    ctx.save();

    // The entire effect is contained, drawn at the tank's origin.
    const ringProgress = easeIn(spawnProgress);
    
    if (ringProgress < 1) {
        ctx.globalAlpha = 1 - spawnProgress; // Effect fades out as it completes

        // Outer glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 25;

        // Outer solid ring
        const outerRadius = size.height * 1.5 * (1 - ringProgress);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner segmented 'data' ring
        const innerRadius = size.height * 1.1 * (1 - ringProgress);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        const rotation = now / 300;
        for (let i = 0; i < 5; i++) {
            const startAngle = rotation + (i * Math.PI * 2 / 5);
            ctx.beginPath();
            ctx.arc(0, 0, innerRadius, startAngle, startAngle + Math.PI / 5);
            ctx.stroke();
        }

        // Converging Data Particles
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const seed = (tankData.id.charCodeAt(i % tankData.id.length) * (i + 1));
            const angle = (seed * 137.5) * (Math.PI / 180); // Golden angle for even distribution
            const maxDist = size.height * 2.5;
            const currentDist = maxDist * (1 - ringProgress);
            const wobble = 10 * Math.sin(now / (100 + (seed % 50)));
            const x = Math.cos(angle) * currentDist + wobble;
            const y = Math.sin(angle) * currentDist + wobble;
            const particleSize = 1 + (seed % 3);
            ctx.fillRect(x - particleSize / 2, y - particleSize / 2, particleSize, particleSize);
        }
    }
    ctx.restore();

    // Set alpha for the tank body itself to fade in.
    const easeOut = (t: number) => t * (2 - t);
    ctx.globalAlpha = easeOut(spawnProgress);
  }


  ctx.rotate(degToRad(angle));

  if (tier === 'intermediate') {
    const treadWidth = size.width * 0.25;
    const treadHeight = size.height * 1.1; // Longer treads
    const chassisWidth = size.width * 0.6;
    const chassisHeight = size.height * 0.8;
  
    ctx.fillStyle = '#2a2a2a'; ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-size.width / 2 - 2, -treadHeight / 2, treadWidth, treadHeight, 4); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(size.width / 2 - treadWidth + 2, -treadHeight / 2, treadWidth, treadHeight, 4); ctx.fill(); ctx.stroke();
  
    ctx.fillStyle = '#5a5a5a';
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
    // Hexagonal chassis shape
    ctx.beginPath();
    ctx.moveTo(-chassisWidth * 0.25, -chassisHeight / 2);
    ctx.lineTo(chassisWidth * 0.25, -chassisHeight / 2);
    ctx.lineTo(chassisWidth * 0.5, 0);
    ctx.lineTo(chassisWidth * 0.25, chassisHeight / 2);
    ctx.lineTo(-chassisWidth * 0.25, chassisHeight / 2);
    ctx.lineTo(-chassisWidth * 0.5, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  } else {
    // Standard tank drawing
    const treadWidth = size.width * 0.22;
    const treadHeight = size.height;
    const chassisWidth = size.width * 0.56;
    const chassisHeight = size.height * 0.9;
  
    const treadGradient = ctx.createLinearGradient(0, -treadHeight / 2, 0, treadHeight / 2);
    treadGradient.addColorStop(0, '#3c3c3c');
    treadGradient.addColorStop(1, '#141414');
    ctx.fillStyle = treadGradient; ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-size.width / 2, -treadHeight / 2, treadWidth, treadHeight, 4); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(size.width / 2 - treadWidth, -treadHeight / 2, treadWidth, treadHeight, 4); ctx.fill(); ctx.stroke();
    
    const chassisGradient = ctx.createLinearGradient(0, -chassisHeight / 2, 0, chassisHeight / 2);
    chassisGradient.addColorStop(0, '#6b6b6b');
    chassisGradient.addColorStop(1, '#4a4a4a');
    ctx.fillStyle = chassisGradient;
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
    ctx.beginPath();
    ctx.moveTo(-chassisWidth * 0.5 + chassisWidth * 0.2, -chassisHeight / 2);
    ctx.lineTo(chassisWidth * 0.5 - chassisWidth * 0.2, -chassisHeight / 2);
    ctx.lineTo(chassisWidth * 0.5, chassisHeight / 2);
    ctx.lineTo(-chassisWidth * 0.5, chassisHeight / 2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  }
  
  // Draw Turret and Barrel
  ctx.save();
  const relativeTurretAngle = turretAngle - angle;
  ctx.rotate(degToRad(relativeTurretAngle));
  
  const barrelLength = size.height / 1.6;
  const barrelWidth = Math.max(3, Math.round(Math.min(size.width, size.height) * 0.04));
  
  const barrelGradient = ctx.createLinearGradient(-barrelWidth / 2, 0, barrelWidth / 2, 0);
  barrelGradient.addColorStop(0, '#4f4f4f');
  barrelGradient.addColorStop(1, '#7a7a7a');
  const tipWidth = barrelWidth * 1.5; const tipHeight = tipWidth * 0.5;

  const drawBarrel = () => {
    ctx.fillStyle = barrelGradient; ctx.fillRect(-barrelWidth / 2, -barrelLength, barrelWidth, barrelLength);
    ctx.fillStyle = color; ctx.fillRect(-tipWidth/2, -barrelLength-tipHeight/2, tipWidth, tipHeight);
  }

  if (activePowerUp === 'dualCannon') {
    const offset = size.width * 0.15;
    ctx.save(); ctx.translate(offset, 0); drawBarrel(); ctx.restore();
    ctx.save(); ctx.translate(-offset, 0); drawBarrel(); ctx.restore();
  } else {
    drawBarrel();
  }
  
  const turretDiameter = Math.min(size.width * 0.55, size.height * 0.55);
  const turretGradient = ctx.createRadialGradient(turretDiameter * -0.1, turretDiameter * -0.15, turretDiameter * 0.05, 0, 0, turretDiameter * 0.7);
  turretGradient.addColorStop(0, 'rgba(200,200,200,0.12)');
  turretGradient.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = turretGradient; ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, turretDiameter / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4a4a4a'; ctx.beginPath(); ctx.arc(0, 0, turretDiameter * 0.26, 0, Math.PI * 2); ctx.fill();

    // --- CYBER BEAM CHARGE EFFECT ---
    if (cyberBeam?.state === 'charging') {
      const chargeProgress = Math.min(1, (now - (cyberBeam.startTime || 0)) / CYBER_BEAM_CHARGE_TIME);
      
      let muzzlePos = { x: 0, y: -barrelLength };
      // The effect stays central, gathering energy between the barrels if dual cannon is active
      
      ctx.save();
      ctx.translate(muzzlePos.x, muzzlePos.y);

      const maxRadius = 35;
      const currentRadius = maxRadius * chargeProgress;
      
      // 1. Outer Aura (pulsing)
      const pulse = 1 + Math.sin(now / 150) * 0.1;
      const auraRadius = currentRadius * 1.5 * pulse;
      if (auraRadius > 0) {
        const auraGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, auraRadius);
        auraGradient.addColorStop(0, `rgba(217, 70, 239, ${0.1 * chargeProgress})`);
        auraGradient.addColorStop(0.5, `rgba(217, 70, 239, ${0.05 * chargeProgress})`);
        auraGradient.addColorStop(1, 'rgba(217, 70, 239, 0)');
        ctx.fillStyle = auraGradient;
        ctx.beginPath();
        ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Inner Glow
      const glowRadius = currentRadius;
      if (glowRadius > 0) {
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        glowGradient.addColorStop(0, `rgba(250, 232, 255, ${0.9 * chargeProgress})`); // light purple
        glowGradient.addColorStop(0.7, `rgba(217, 70, 239, ${0.4 * chargeProgress})`); // magenta
        glowGradient.addColorStop(1, 'rgba(217, 70, 239, 0)');
        ctx.fillStyle = glowGradient;
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 30 * chargeProgress;
        ctx.beginPath();
        ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 3. Core
      const coreRadius = glowRadius * 0.25;
      if (coreRadius > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * chargeProgress})`;
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 15 * chargeProgress;
        ctx.beginPath();
        ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Inward-drawing particles/arcs
      const particleCount = 10;
      ctx.strokeStyle = `rgba(250, 232, 255, ${0.6 * chargeProgress})`; // light purple
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#d946ef';
      ctx.shadowBlur = 10;
      
      for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2 + (now / 500);
          const startDist = glowRadius * (1.2 + Math.sin(now/200 + i) * 0.2);
          
          const particlePhase = ((now / 300) + i * 0.3) % 1;
          const currentDist = startDist - (startDist - coreRadius) * particlePhase;

          if (currentDist > coreRadius) {
            const x = Math.cos(angle) * currentDist;
            const y = Math.sin(angle) * currentDist;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x * 0.8, y * 0.8); // Little tail
            ctx.stroke();
          }
      }
      
      ctx.restore();
    }

  ctx.restore(); // Restore from turret rotation

  // --- SCANLINE OVERLAY on spawn ---
  if (status === 'spawning' && spawnTime) {
    const spawnProgress = Math.min(1, (now - spawnTime) / SPAWN_DURATION);
    const totalHeight = size.height;
    
    const scanlineY = -totalHeight / 2 + totalHeight * spawnProgress;
    const scanlineAlpha = Math.sin(spawnProgress * Math.PI) * 0.6;
    
    ctx.save();
    ctx.globalAlpha = scanlineAlpha;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillRect(-size.width / 2, scanlineY - 1, size.width, 2);
    ctx.restore();
  }

  // Handle hit flash
  if (lastHitTime && now - lastHitTime < HIT_FLASH_DURATION) {
    const flashProgress = (now - lastHitTime) / HIT_FLASH_DURATION;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - flashProgress)})`;
    ctx.fillRect(-size.width / 2, -size.height / 2, size.width, size.height);
  }

  // Draw poison effect
  // FIX: Use a type guard to safely access `stacks` only on PoisonStatusEffect.
  const poisonEffect = statusEffects?.find(e => e.type === 'poison');
  if (poisonEffect && poisonEffect.type === 'poison') {
    const alpha = 0.5 + Math.sin(now / 100) * 0.2;
    ctx.fillStyle = `rgba(132, 204, 22, ${alpha})`; // lime-500
    for (let i = 0; i < poisonEffect.stacks * 2; i++) {
        const particleProgress = ((now / (800 + (i*50))) + (i * 0.3)) % 1;
        const x = (Math.random() - 0.5) * size.width;
        const y = -size.height / 2 + (size.height * particleProgress);
        ctx.fillRect(x, y, 2, 2);
    }
  }
  
  // Draw stun effect
  const stunEffect = statusEffects?.find(e => e.type === 'stun');
  if (stunEffect) {
    drawStunEffect(ctx, now, stunEffect, size);
  }

  // Draw frozen outline for enemies
  if (isTimeStopped && tankData.type === 'enemy') {
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.7)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.strokeRect(-size.width/2 - 2, -size.height/2 - 2, size.width + 4, size.height + 4);
  }

  ctx.restore(); // Restore from tank translation/rotation
}

export function drawMinion(ctx: CanvasRenderingContext2D, minion: Minion, now: number) {
  const { position, angle, status, spawnTime, lastHitTime, health, maxHealth, statusEffects } = minion;
  
  ctx.save();
  ctx.translate(position.x, position.y);

  if (status === 'spawning' && spawnTime) {
    const spawnProgress = Math.min(1, (now - spawnTime) / MINION_SPAWN_DURATION);
    const easeIn = (t: number) => t * t;
    const ringProgress = easeIn(spawnProgress);

    if (ringProgress < 1) {
        ctx.globalAlpha = 1 - spawnProgress;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 20;
        const outerRadius = 40 * (1 - ringProgress);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = spawnProgress * spawnProgress;
  }

  const HEAD_WIDTH = 40;
  const HEAD_HEIGHT = 40;

  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 8;
  
  // Skull shape
  ctx.fillStyle = '#4a4a4a';
  ctx.strokeStyle = '#1c1c1c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-HEAD_WIDTH / 2, -HEAD_HEIGHT * 0.4);
  ctx.bezierCurveTo(-HEAD_WIDTH / 2, -HEAD_HEIGHT * 0.6, HEAD_WIDTH / 2, -HEAD_HEIGHT * 0.6, HEAD_WIDTH / 2, -HEAD_HEIGHT * 0.4);
  ctx.lineTo(HEAD_WIDTH * 0.3, HEAD_HEIGHT * 0.5);
  ctx.lineTo(-HEAD_WIDTH * 0.3, HEAD_HEIGHT * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Jaw part
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.moveTo(-HEAD_WIDTH * 0.6, -5);
  ctx.lineTo(HEAD_WIDTH * 0.6, -5);
  ctx.lineTo(HEAD_WIDTH * 0.3, HEAD_HEIGHT * 0.5);
  ctx.lineTo(-HEAD_WIDTH * 0.3, HEAD_HEIGHT * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Glowing eyes
  const eyeY = -HEAD_HEIGHT * 0.2;
  const eyeXOffset = HEAD_WIDTH * 0.25;
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 15;
  
  ctx.beginPath();
  ctx.arc(-eyeXOffset, eyeY, 5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(eyeXOffset, eyeY, 6, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 150, 150, 0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(eyeXOffset, eyeY - 8); ctx.lineTo(eyeXOffset, eyeY + 8);
  ctx.moveTo(eyeXOffset - 8, eyeY); ctx.lineTo(eyeXOffset + 8, eyeY);
  ctx.stroke();

  // Draw Gun
  ctx.save();
  ctx.rotate(degToRad(angle - 90));
  
  const gunLength = 35;
  const gunWidth = 8;
  const gunYOffset = HEAD_HEIGHT / 2 - 5;
  
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(-gunWidth / 2, gunYOffset, gunWidth, gunLength);
  
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-gunWidth / 2 - 1, gunYOffset + gunLength, gunWidth + 2, 4);
  
  ctx.restore();

  if (lastHitTime && now - lastHitTime < HIT_FLASH_DURATION) {
    const flashProgress = (now - lastHitTime) / HIT_FLASH_DURATION;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - flashProgress)})`;
    ctx.beginPath();
    ctx.arc(0, 0, HEAD_WIDTH / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw stun effect
  const stunEffect = statusEffects?.find(e => e.type === 'stun');
  if (stunEffect) {
    drawStunEffect(ctx, now, stunEffect, {width: HEAD_WIDTH, height: HEAD_HEIGHT});
  }
  
  const healthPercentage = health / maxHealth;
  const barWidth = HEAD_WIDTH;
  const barY = HEAD_HEIGHT / 2 + 8;
  ctx.fillStyle = '#111';
  ctx.fillRect(-barWidth / 2, barY, barWidth, 5);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercentage, 5);

  ctx.restore();
}

export function drawPowerUp(ctx: CanvasRenderingContext2D, powerUp: PowerUp, now: number) {
    ctx.save();
    ctx.translate(powerUp.position.x, powerUp.position.y);

    const containerPulse = 1 + Math.sin(now / 250) * 0.05;
    ctx.scale(containerPulse, containerPulse);

    const baseRadius = 22;
    const ringColors = {
        'shield': '#0ea5e9', 'dualCannon': '#f97316', 'regensule': '#22c55e',
        'reflectorField': '#a855f7', 'lifeLeech': '#d946ef', 'homingMissiles': '#f59e0b'
    };
    const mainColor = ringColors[powerUp.type] || '#FFFFFF';

    // 1. Outer animated rings
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = mainColor;
    ctx.globalAlpha = 0.6 + Math.sin(now / 200) * 0.2;
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 15;
    const rot1 = now / 1500;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 1.2, rot1, rot1 + Math.PI / 2);
    ctx.arc(0, 0, baseRadius * 1.2, rot1 + Math.PI, rot1 + Math.PI * 1.5);
    ctx.stroke();
    const rot2 = -now / 1200;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 1.35, rot2, rot2 + Math.PI / 3);
    ctx.arc(0, 0, baseRadius * 1.35, rot2 + Math.PI, rot2 + Math.PI * 1.33);
    ctx.stroke();
    ctx.restore();

    // 2. Base container (static hexagon)
    ctx.save();
    const drawHexagon = (radius: number) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = degToRad(60 * i + 30);
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
    };
    ctx.fillStyle = 'rgba(10, 10, 20, 0.8)';
    ctx.strokeStyle = `rgba(150, 180, 255, 0.4)`;
    ctx.lineWidth = 1;
    drawHexagon(baseRadius);
    ctx.fill();
    ctx.stroke();
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius);
    grad.addColorStop(0, `rgba(100, 150, 255, 0.2)`);
    grad.addColorStop(1, `rgba(10, 10, 20, 0)`);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // 3. Icon drawing
    ctx.save();
    const iconPulse = 1 + Math.sin(now / 180) * 0.08;
    ctx.scale(iconPulse, iconPulse);
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#FFFFFF';

    switch (powerUp.type) {
        case 'shield':
            ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 2.5;
            ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 1.0; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.stroke();
            break;
        case 'dualCannon':
            const bW = 5, bH = 16, sp = 5;
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath(); ctx.roundRect(-sp / 2 - bW, -bH / 2, bW, bH, 2); ctx.roundRect(sp / 2, -bH / 2, bW, bH, 2);
            ctx.fill();
            break;
        case 'regensule':
            ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke();
            ctx.lineWidth = 1.5; const rRot = now / 800; ctx.beginPath(); ctx.arc(0, 0, 12, rRot, rRot + Math.PI * 1.5); ctx.stroke();
            break;
        case 'reflectorField':
            ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, 12, degToRad(120), degToRad(240)); ctx.stroke();
            const rPulse = Math.sin(now / 150) * 5; ctx.beginPath(); ctx.moveTo(-15, -10); ctx.lineTo(-2, 0 + rPulse); ctx.lineTo(-15, 10); ctx.stroke();
            break;
        case 'lifeLeech':
            ctx.fillStyle = '#f0abfc';
            ctx.beginPath(); ctx.moveTo(0, -3); ctx.bezierCurveTo(4, -10, 10, -6, 0, 5); ctx.bezierCurveTo(-10, -6, -4, -10, 0, -3); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, -6); ctx.moveTo(2.5, -4); ctx.lineTo(0, -6); ctx.lineTo(-2.5, -4); ctx.stroke();
            break;
        case 'homingMissiles':
            ctx.fillStyle = '#fb923c'; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.save();
                const xOff = (i - 1) * 8; const yOff = i === 1 ? -4 : 4;
                ctx.translate(xOff, yOff); ctx.rotate(degToRad(i === 1 ? 0 : (i === 0 ? -10 : 10)));
                ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(3, 3); ctx.lineTo(-3, 3); ctx.closePath();
                ctx.fill(); ctx.stroke();
                ctx.restore();
            }
            break;
    }
    ctx.restore();
    ctx.restore();
}

function drawSingleChronoShard(ctx: CanvasRenderingContext2D, now: number, createdAt: number) {
    const shimmer = Math.sin(now / 100 + createdAt / 50) * 0.2 + 0.8;
    const color = `rgba(147, 197, 253, ${shimmer})`; // blue-300
    const corePulse = Math.sin(now / 150 + createdAt / 80) * 0.1 + 0.9;
    const length = 22;
    const width = 6;

    ctx.shadowColor = '#93c5fd';
    ctx.shadowBlur = 25;

    // Outer crystalline shape (semi-transparent)
    ctx.fillStyle = `rgba(147, 197, 253, ${0.3 * shimmer})`; // blue-300 with alpha
    ctx.beginPath();
    ctx.moveTo(0, -length / 2);
    ctx.lineTo(width, 0);
    ctx.lineTo(width * 0.7, length / 2);
    ctx.lineTo(-width * 0.7, length / 2);
    ctx.lineTo(-width, 0);
    ctx.closePath();
    ctx.fill();

    // Inner core (bright)
    ctx.fillStyle = `rgba(255, 255, 255, ${shimmer * 1.2})`;
    ctx.beginPath();
    ctx.moveTo(0, -length / 2 * 0.8);
    ctx.lineTo(width * 0.5 * corePulse, 0);
    ctx.lineTo(0, length / 2 * 0.6);
    ctx.lineTo(-width * 0.5 * corePulse, 0);
    ctx.closePath();
    ctx.fill();

    // Internal light rays
    ctx.strokeStyle = `rgba(200, 220, 255, ${0.5 * shimmer})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0,0); ctx.lineTo(0, -length/2);
    ctx.moveTo(0,0); ctx.lineTo(width * 0.8, length / 4);
    ctx.moveTo(0,0); ctx.lineTo(-width * 0.8, length / 4);
    ctx.stroke();
}

export function drawProjectile(ctx: CanvasRenderingContext2D, projectile: Projectile, owner: Tank | undefined, toxicRoundsActive: boolean) {
    const now = Date.now();
    const { position, isFrozen } = projectile;

    ctx.save();
    ctx.translate(position.x, position.y);
    
    if (projectile.isChronoShard || (projectile.isHoming && projectile.isChronoShard)) { // Chrono shards can be homing
        ctx.rotate(degToRad(projectile.angle - 90));
        drawSingleChronoShard(ctx, now, projectile.id.charCodeAt(5)); // Use ID for a seed

        // Redesigned trail for moving shards
        const trailLength = 15;
        const particleCount = 5;
        ctx.fillStyle = `rgba(147, 197, 253, 0.7)`; // blue-300
        for (let i = 0; i < particleCount; i++) {
            const progress = i / particleCount;
            const size = (2 - progress * 2);
            const x = (Math.random() - 0.5) * 8 * (1-progress);
            const y = (progress * trailLength) + (Math.random() * 5);
            ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }

    } else if (projectile.isHoming) {
        drawHomingMissile(ctx, projectile, now);
    } else if (isFrozen) {
        const color = '#60a5fa'; // blue-400
        const coreRadius = 5;
        const pulse = 0.9 + Math.sin(now / 150) * 0.1;
    
        // Crystalline shell
        ctx.strokeStyle = `rgba(191, 219, 254, 0.6)`; // blue-200
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 15;
        const hexRadius = 12;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = degToRad(60 * i + 15);
            const x = hexRadius * Math.cos(angle);
            const y = hexRadius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Main projectile core
        const glowRadius = 15;
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius * pulse);
        glowGradient.addColorStop(0, `${color}CC`);
        glowGradient.addColorStop(0.7, `${color}50`);
        glowGradient.addColorStop(1, `${color}00`);
        ctx.fillStyle = glowGradient;
        ctx.beginPath(); ctx.arc(0, 0, glowRadius * pulse, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = color; ctx.shadowBlur = 20 * pulse;
        ctx.beginPath(); ctx.arc(0, 0, coreRadius, 0, Math.PI * 2); ctx.fill();

        // Crackle effect
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * pulse})`;
        ctx.lineWidth = 1; ctx.shadowBlur = 0;
        for (let i = 0; i < 3; i++) {
            const startAngle = (i * 120 + projectile.id.charCodeAt(5)) % 360;
            const radius = hexRadius * 1.2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(degToRad(startAngle)) * radius, Math.sin(degToRad(startAngle)) * radius);
            ctx.lineTo(Math.cos(degToRad(startAngle + 5)) * radius * 1.3, Math.sin(degToRad(startAngle + 5)) * radius * 1.3);
            ctx.stroke();
        }

    } else if (projectile.isBossOrb) {
        const color = '#F000B8'; // Magenta color for boss orb
        const coreRadius = projectile.size.width / 2 * 0.7; // Smaller core
        const glowRadius = projectile.size.width / 2 * 1.5; // Larger glow
        const pulse = 0.8 + Math.sin(now / 80 + projectile.id.charCodeAt(5)) * 0.2;

        // Outer glow
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius * pulse);
        glowGradient.addColorStop(0, `${color}80`); // Slightly opaque
        glowGradient.addColorStop(0.7, `${color}30`); // More transparent
        glowGradient.addColorStop(1, `${color}00`); // Fully transparent
        ctx.fillStyle = glowGradient;
        ctx.beginPath(); ctx.arc(0, 0, glowRadius * pulse, 0, Math.PI * 2); ctx.fill();

        // Inner core (bright)
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = color;
        ctx.shadowBlur = 25 * pulse; // Stronger glow for boss orb
        ctx.beginPath(); ctx.arc(0, 0, coreRadius, 0, Math.PI * 2); ctx.fill();

        // Energy crackle/particles
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * pulse})`;
        ctx.lineWidth = 1.5;
        const numCracks = 3;
        for (let i = 0; i < numCracks; i++) {
            ctx.beginPath();
            const startAngle = (now / 100 + i * (Math.PI * 2 / numCracks));
            const endAngle = startAngle + Math.PI / (numCracks * 2);
            ctx.arc(0, 0, coreRadius + 2, startAngle, endAngle);
            ctx.stroke();
        }
    } else {
        const isPoison = owner?.type === 'player' && toxicRoundsActive;
        const color = isPoison ? '#84cc16' : (projectile.ownerId.startsWith('minion-') ? '#ef4444' : (owner?.color || '#FFFFFF'));
        const coreRadius = 4;
        const glowRadius = 12;
        const pulse = 0.8 + Math.sin(now / 80 + projectile.id.charCodeAt(5)) * 0.2;

        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius * pulse);
        glowGradient.addColorStop(0, `${color}80`);
        glowGradient.addColorStop(0.7, `${color}30`);
        glowGradient.addColorStop(1, `${color}00`);
        ctx.fillStyle = glowGradient;
        ctx.beginPath(); ctx.arc(0, 0, glowRadius * pulse, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = color;
        ctx.shadowBlur = 15 * pulse;
        ctx.beginPath(); ctx.arc(0, 0, coreRadius, 0, Math.PI * 2); ctx.fill();

        if (isPoison) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = `rgba(163, 230, 53, ${0.5 + Math.sin(now/50)*0.2})`;
            const trailCount = 3;
            for (let i = 0; i < trailCount; i++) {
                const angle = projectile.angle + 180 + (Math.random() - 0.5) * 60;
                const dist = 5 + Math.random() * 10;
                const x = Math.cos(degToRad(angle - 90)) * dist;
                const y = Math.sin(degToRad(angle - 90)) * dist;
                ctx.fillRect(x-1, y-1, 2, 2);
            }
        }
    }

    ctx.shadowBlur = 0;
    ctx.restore();
}

function drawHomingMissile(ctx: CanvasRenderingContext2D, missile: Projectile, now: number) {
    const { angle } = missile;
    ctx.save();
    ctx.rotate(degToRad(angle - 90));

    const color = '#f97316'; // orange-500
    const bodyLength = 20;
    const bodyWidth = 8;
    
    // Plasma Trail
    const trailLength = 25;
    const trailPulse = 1 + Math.sin(now/40) * 0.2;
    const trailGradient = ctx.createLinearGradient(0,0,0, trailLength * trailPulse);
    trailGradient.addColorStop(0, '#fef3c7'); // amber-100
    trailGradient.addColorStop(0.5, '#fbbf24'); // amber-400
    trailGradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = trailGradient;
    ctx.shadowColor = '#f59e0b'; // amber-500
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-bodyWidth * 0.8, trailLength);
    ctx.lineTo(bodyWidth * 0.8, trailLength);
    ctx.closePath();
    ctx.fill();

    // Missile Body
    ctx.fillStyle = '#4a4a4a';
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;

    // Main hull
    ctx.beginPath();
    ctx.moveTo(0, -bodyLength / 2);
    ctx.lineTo(bodyWidth / 2, bodyLength * 0.3);
    ctx.lineTo(-bodyWidth / 2, bodyLength * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Fins
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.moveTo(bodyWidth / 2, bodyLength * 0.1);
    ctx.lineTo(bodyWidth * 1.5, bodyLength * 0.4);
    ctx.lineTo(bodyWidth / 2, bodyLength * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(-bodyWidth / 2, bodyLength * 0.1);
    ctx.lineTo(-bodyWidth * 1.5, bodyLength * 0.4);
    ctx.lineTo(-bodyWidth / 2, bodyLength * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Warhead
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -bodyLength / 2 - 4);
    ctx.lineTo(bodyWidth * 0.4, -bodyLength/2);
    ctx.lineTo(-bodyWidth * 0.4, -bodyLength/2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}


export function drawWall(ctx: CanvasRenderingContext2D, wall: Wall) {
    ctx.fillStyle = '#44403c'; // stone-700
    ctx.strokeStyle = '#0891b2'; // cyan-700
    ctx.lineWidth = 2;
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
}

export function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, gridSize: number) {
    ctx.strokeStyle = 'rgba(79, 79, 79, 0.18)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
}

export function drawPath(ctx: CanvasRenderingContext2D, path: Vector[]) {
  if (!path || path.length < 2) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)'; ctx.lineWidth = 2; ctx.setLineDash([4, 8]);
  ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) { ctx.lineTo(path[i].x, path[i].y); }
  ctx.stroke();
  ctx.restore();
}

export function drawAnimations(ctx: CanvasRenderingContext2D, animations: Animation[], now: number) {
  animations.forEach(anim => {
    const progress = Math.min(1.0, (now - anim.createdAt) / anim.duration);
    if (progress >= 1.0) return;

    ctx.save();
    ctx.translate(anim.position.x, anim.position.y);

    switch (anim.type) {
      case 'chronoShardImpact': {
        const alpha = 1 - progress;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#93c5fd'; // blue-300
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 15;
        for (let i = 0; i < 7; i++) {
            ctx.save();
            ctx.rotate(i * (Math.PI * 2 / 7) + progress * 2);
            ctx.lineWidth = Math.max(0.1, 2 * (1 - progress));
            ctx.beginPath();
            ctx.moveTo(10 * progress, 0);
            ctx.lineTo(25 * progress, 0);
            ctx.stroke();
            ctx.restore();
        }
        break;
      }
      case 'homingExplosion': {
        const explosionColor = '#f97316';
        if (progress < 0.25) {
            const flashProgress = progress / 0.25;
            ctx.globalAlpha = 1 - flashProgress; ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 50 * (1 - flashProgress);
            ctx.beginPath(); ctx.arc(0, 0, Math.max(0, 30 * flashProgress), 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1 - progress; ctx.strokeStyle = explosionColor;
        ctx.lineWidth = Math.max(1, 8 * (1 - progress));
        ctx.shadowColor = explosionColor; ctx.shadowBlur = 25;
        ctx.beginPath(); ctx.arc(0, 0, Math.max(0, 50 * progress), 0, Math.PI * 2); ctx.stroke();
        
        ctx.fillStyle = '#fbbf24'; // amber-300
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + progress * 2;
            const distance = 40 * progress;
            const x = Math.cos(angle) * distance; const y = Math.sin(angle) * distance;
            const size = Math.max(0, 4 * (1 - progress));
            ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }
        break;
      }
      case 'poisonTick': {
          const alpha = Math.sin(progress * Math.PI); // Fades in and out
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#84cc16'; // lime-500
          ctx.font = 'bold 14px Orbitron';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#000';
          ctx.shadowBlur = 5;
          ctx.fillText(`-${anim.width}`, 0, -20 * progress); // Damage value stored in width
          break;
      }
      case 'finalBlast': {
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const easedProgress = easeOutCubic(progress);
        const fullRadius = anim.width! / 2;

        if (progress < 0.1) {
            const flashProgress = progress / 0.1;
            ctx.globalAlpha = 1 - flashProgress;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(0, 0, fullRadius * 1.1, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 0.7 * (1 - progress * 0.5);
        const coreRadius = fullRadius * easedProgress;
        const pulse = 1 + Math.sin(now / 40) * 0.1;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius * pulse);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * (1 - progress)})`);
        gradient.addColorStop(0.3, `rgba(255, 200, 150, ${0.8 * (1 - progress)})`);
        gradient.addColorStop(0.7, `rgba(239, 68, 68, ${0.6 * (1 - progress)})`);
        gradient.addColorStop(1, `rgba(127, 29, 29, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, coreRadius * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        const subExplosionCount = 15;
        for (let i = 0; i < subExplosionCount; i++) {
            const seed = (anim.id.charCodeAt(i % anim.id.length) * (i + 1));
            const startProgress = (seed % 80) / 100;
            const subDuration = 0.2 + ((seed * 13) % 20) / 100;

            if (progress > startProgress && progress < startProgress + subDuration) {
                const subProgress = (progress - startProgress) / subDuration;
                const easeOutSub = 1 - Math.pow(1 - subProgress, 3);
                const maxSubRadius = fullRadius * (0.2 + ((seed * 29) % 30) / 100);
                const currentSubRadius = maxSubRadius * easeOutSub;
                const angle = ((seed * 53) % 360) * (Math.PI / 180);
                const dist = fullRadius * 0.6 * ((seed * 71) % 100 / 100);
                const subX = Math.cos(angle) * dist;
                const subY = Math.sin(angle) * dist;

                ctx.globalAlpha = (1 - subProgress) * 0.8;
                const subGradient = ctx.createRadialGradient(subX, subY, 0, subX, subY, currentSubRadius);
                subGradient.addColorStop(0, `rgba(255, 255, 224, ${0.9 * (1 - subProgress)})`);
                subGradient.addColorStop(1, `rgba(255, 165, 0, 0)`);
                ctx.fillStyle = subGradient;
                ctx.beginPath();
                ctx.arc(subX, subY, currentSubRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.globalAlpha = 1;
        const shockwaveTimings = [0, 0.3, 0.6];
        shockwaveTimings.forEach(startTime => {
            if (progress > startTime) {
                const shockwaveProgress = (progress - startTime) / 0.4;
                if (shockwaveProgress <= 1) {
                    ctx.globalAlpha = 1 - shockwaveProgress;
                    ctx.strokeStyle = `rgba(255, 200, 150, ${1 - shockwaveProgress})`;
                    ctx.lineWidth = 10 * (1 - shockwaveProgress);
                    ctx.shadowColor = '#FF9933';
                    ctx.shadowBlur = 20;
                    ctx.beginPath();
                    ctx.arc(0, 0, fullRadius * shockwaveProgress, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        });
        break;
      }
      case 'mortarStrike': {
        const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
        const easedProgress = easeOutQuint(progress);

        // 1. Downward strike beam (very fast)
        if (progress < 0.15) {
            const beamProgress = progress / 0.15;
            ctx.globalAlpha = 1 - beamProgress;
            const beamHeight = 200;
            const gradient = ctx.createLinearGradient(0, -beamHeight, 0, 0);
            gradient.addColorStop(0, 'rgba(255, 150, 150, 0)');
            gradient.addColorStop(0.8, 'rgba(255, 200, 200, 1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');

            ctx.fillStyle = gradient;
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 30;
            ctx.fillRect(-4, -beamHeight * (1 - beamProgress), 8, beamHeight);
        }

        // 2. Ground Shockwave
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = `rgba(239, 68, 68, ${1 - progress})`; // red-500
        ctx.lineWidth = Math.max(1, 6 * (1 - progress));
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, 40 * easedProgress, 0, Math.PI * 2);
        ctx.stroke();

        // 3. Debris/Sparks
        ctx.shadowBlur = 0;
        const sparkCount = 8;
        for (let i = 0; i < sparkCount; i++) {
            ctx.fillStyle = `rgba(251, 191, 36, ${1 - progress})`; // amber-400
            const seed = anim.id.charCodeAt(i % anim.id.length) + i;
            const angle = (seed / sparkCount) * Math.PI * 2;
            const distance = (30 + (seed % 20)) * easedProgress;

            // Apply a simple parabolic arc to simulate gravity
            const upwardMotion = 20 * (easedProgress - easedProgress * easedProgress);

            const sparkX = Math.cos(angle) * distance;
            const sparkY = Math.sin(angle) * distance - upwardMotion;
            const size = Math.max(0, 4 * (1 - progress));
            ctx.fillRect(sparkX - size / 2, sparkY - size / 2, size, size);
        }
        break;
      }
      case 'laneAttack': {
        if (!anim.width || !anim.height || anim.angle === undefined) break;

        const easeOutQuad = (t: number) => t * (2 - t);
        const fadeProgress = easeOutQuad(progress);
        const alpha = 1 - fadeProgress;

        ctx.globalAlpha = alpha;
        ctx.rotate(degToRad(anim.angle));
        
        const flashAlpha = (1 - progress) * (1 - progress);

        // Main fill
        ctx.fillStyle = `rgba(239, 68, 68, ${0.3 * alpha})`; // base red fill
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 35 * (1 - fadeProgress);
        ctx.fillRect(-anim.width / 2, -anim.height / 2, anim.width, anim.height);

        // Bright Core Flash
        ctx.fillStyle = `rgba(255, 200, 200, ${0.9 * flashAlpha})`;
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 20 * flashAlpha;
        ctx.fillRect(-anim.width / 2, -anim.height / 2, anim.width, anim.height);

        // Crackling energy effect inside
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255, 220, 220, ${0.7 * alpha})`;
        ctx.lineWidth = 2;
        
        const lineCount = Math.floor(anim.width / 20);
        for (let i = 0; i < lineCount; i++) {
            ctx.beginPath();
            const startX = (Math.random() - 0.5) * anim.width;
            ctx.moveTo(startX, -anim.height / 2);
            for (let y = -anim.height / 2; y < anim.height / 2; y += 30) {
                const nextX = startX + (Math.random() - 0.5) * 20;
                ctx.lineTo(nextX, y);
            }
            ctx.stroke();
        }
        break;
      }
      case 'barrageImpact':
        const impactColor = '#f59e0b'; // amber-500
        const easeOut = (t: number) => t * (2 - t);
        const easedProgress = easeOut(progress);
        
        // 1. Core flash
        if (progress < 0.4) {
          const flashProgress = progress / 0.4;
          ctx.globalAlpha = 1 - flashProgress;
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = impactColor;
          ctx.shadowBlur = 30 * (1 - flashProgress);
          ctx.beginPath();
          ctx.arc(0, 0, 15 * flashProgress, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. Lingering scorch mark/glow
        ctx.globalAlpha = 1 - progress;
        const scorchRadius = 15 * easedProgress;
        const scorchGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, scorchRadius);
        scorchGradient.addColorStop(0, 'rgba(249, 115, 22, 0.8)');
        scorchGradient.addColorStop(0.7, 'rgba(249, 115, 22, 0.2)');
        scorchGradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
        ctx.fillStyle = scorchGradient;
        ctx.beginPath();
        ctx.arc(0, 0, scorchRadius, 0, Math.PI * 2);
        ctx.fill();

        // 3. Upward sparks
        ctx.shadowBlur = 0;
        const sparkCount = 4;
        for(let i = 0; i < sparkCount; i++) {
          ctx.fillStyle = `rgba(251, 191, 36, ${1 - progress})`; // amber-400
          const angle = (i / sparkCount) * Math.PI * 2 + (anim.id.charCodeAt(5) % 5);
          const distance = 30 * easedProgress;
          const sparkX = Math.cos(angle) * distance;
          const sparkY = Math.sin(angle) * distance;
          const size = Math.max(0, 3 * (1 - progress));
          ctx.fillRect(sparkX - size/2, sparkY - size/2, size, size);
        }
        break;

      case 'explosion':
        const baseColor = anim.color || '#f97316'; // Default to orange
        const randomSeed = (anim.id.charCodeAt(5) || 1) * (anim.id.charCodeAt(7) || 1);

        // 1. Core Flash (first 25% of animation)
        if (progress < 0.25) {
            const flashProgress = progress / 0.25;
            ctx.globalAlpha = 1 - flashProgress;
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 60 * (1 - flashProgress);
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(0, 30 * flashProgress), 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 2. Shockwave (full duration)
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = Math.max(1, 8 * (1 - progress));
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0, 50 * progress), 0, Math.PI * 2);
        ctx.stroke();

        // 3. Debris Particles (starts after a small delay)
        if (progress > 0.1) {
            const particleProgress = (progress - 0.1) / 0.9;
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 1 - particleProgress;
            const particleCount = 7;
            for (let i = 0; i < particleCount; i++) {
                // Use seed to get consistent random direction and speed for each particle
                const angle = ((randomSeed * i * 3) % 360) * (Math.PI / 180);
                const speed = 50 + ((randomSeed * i) % 40); // Max distance
                
                // Parabolic arc for slowdown
                const currentDistance = speed * particleProgress * (1 - particleProgress * 0.7);

                const x = Math.cos(angle) * currentDistance;
                const y = Math.sin(angle) * currentDistance;
                const size = Math.max(0, 4 * (1 - particleProgress));
                ctx.fillRect(x - size / 2, y - size / 2, size, size);
            }
        }
        break;
      
      case 'hit':
        const hitColor = anim.color || '#FFFFFF';
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = hitColor;
        const hitRadius = 25 * progress;
        const hitWidth = Math.max(0, 4 * (1 - progress));
        ctx.lineWidth = Math.max(0, hitWidth);
        ctx.beginPath(); ctx.arc(0, 0, Math.max(0,hitRadius), 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = hitColor; ctx.shadowBlur = 10;
        for(let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + (anim.id.charCodeAt(5) % 5);
            const distance = 30 * progress;
            const particleX = Math.cos(angle) * distance; const particleY = Math.sin(angle) * distance;
            const size = Math.max(0, 3 * (1 - progress));
            ctx.beginPath(); ctx.arc(particleX, particleY, size, 0, Math.PI * 2); ctx.fill();
        }
        break;

      case 'shieldHit':
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = `${anim.color || '#06b6d4'}`;
        ctx.shadowColor = `${anim.color || '#06b6d4'}`;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        const shieldHitRadius = 10 * (1-progress);
        ctx.arc(0, 0, Math.max(0, shieldHitRadius), 0, Math.PI * 2);
        ctx.fill();
        break;
      
      case 'shieldBreak':
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = `${anim.color || '#06b6d4'}`;
        const shieldBreakWidth = 4 * (1 - progress);
        ctx.lineWidth = Math.max(0, shieldBreakWidth);
        ctx.shadowColor = `${anim.color || '#06b6d4'}`;
        ctx.shadowBlur = 15;
        const radius = Math.max(0, 40 * progress);
        // Draw shattering arcs
        for(let i = 0; i < 5; i++) {
          const startAngle = (i / 5) * Math.PI * 2 + progress * 2;
          const endAngle = startAngle + Math.PI / 4;
          ctx.beginPath();
          ctx.arc(0, 0, radius, startAngle, endAngle);
          ctx.stroke();
        }
        break;

      case 'muzzleFlash':
        ctx.rotate(degToRad(anim.angle! - 90));
        const randomSeedFlash = anim.id.charCodeAt(anim.id.length - 1) % 10;
        
        const easeOutFlash = (t: number) => 1 - Math.pow(1 - t, 4);
        const easedFlashProgress = easeOutFlash(progress);

        // --- 1. Shockwave Ring ---
        const shockwaveRadius = 30 * easedFlashProgress;
        const shockwaveAlpha = 1 - progress;
        ctx.strokeStyle = `rgba(255, 204, 102, ${shockwaveAlpha * 0.7})`;
        ctx.lineWidth = 3 * (1 - progress);
        ctx.beginPath();
        ctx.arc(0, 0, shockwaveRadius, 0, Math.PI * 2);
        ctx.stroke();

        // --- 2. Main Blast Cone (Star-shaped) ---
        const starPoints = 5;
        const maxBlastLength = 35 + (randomSeedFlash * 2);
        const blastLength = maxBlastLength * (1 - progress);
        
        const blastGradient = ctx.createLinearGradient(0, 0, 0, -blastLength);
        blastGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        blastGradient.addColorStop(0.3, 'rgba(255, 235, 170, 0.9)');
        blastGradient.addColorStop(1, 'rgba(255, 159, 64, 0)');

        ctx.fillStyle = blastGradient;
        ctx.shadowColor = '#ffc152';
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let i = 0; i < starPoints * 2; i++) {
            const length = i % 2 === 0 ? blastLength : blastLength / 2;
            const angle = (i / (starPoints * 2)) * Math.PI * 2 - Math.PI / 2;
            ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
        }
        ctx.closePath();
        ctx.fill();

        // --- 3. Bright Core Flash ---
        if (progress < 0.3) {
            const coreProgress = progress / 0.3;
            // FIX: Ensure radius is non-negative to prevent canvas errors from floating point inaccuracies.
            const coreRadius = Math.max(0, 10 * (1 - coreProgress));
            const coreAlpha = 1 - coreProgress;
            
            if (coreRadius > 0) {
              const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius);
              coreGradient.addColorStop(0, `rgba(255, 255, 255, ${coreAlpha})`);
              coreGradient.addColorStop(0.8, `rgba(255, 255, 220, ${coreAlpha * 0.5})`);
              coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
              
              ctx.fillStyle = coreGradient;
              ctx.beginPath();
              ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
              ctx.fill();
            }
        }
        break;
    }
    // Reset any lingering shadows or alphas for the next animation
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  });
}

export function drawBarrageReticle(ctx: CanvasRenderingContext2D, position: Vector, radius: number, now: number) {
  ctx.save();
  ctx.translate(position.x, position.y);

  const color = `rgba(251, 191, 36, 0.7)`; // amber-400
  ctx.strokeStyle = color;
  ctx.fillStyle = `rgba(251, 191, 36, 0.08)`;
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;

  // Main circle
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fill();

  // Rotating outer segments
  const rotation = now / 1000;
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const startAngle = rotation + i * (Math.PI / 2);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.1, startAngle, startAngle + Math.PI / 4);
    ctx.stroke();
  }

  // Crosshairs
  const crosshairLength = radius * 0.3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-crosshairLength, 0);
  ctx.lineTo(crosshairLength, 0);
  ctx.moveTo(0, -crosshairLength);
  ctx.lineTo(0, crosshairLength);
  ctx.stroke();

  ctx.restore();
}

export function drawChronoReticle(ctx: CanvasRenderingContext2D, position: Vector, radius: number, now: number) {
    ctx.save();
    ctx.translate(position.x, position.y);
  
    const color = `rgba(192, 132, 252, 0.8)`; // violet-400
    ctx.strokeStyle = color;
    ctx.fillStyle = `rgba(192, 132, 252, 0.1)`;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
  
    // Main circle
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();
  
    // Inner clock hands
    const rotation = now / 2000;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0,0); ctx.lineTo(0, -radius * 0.6);
    ctx.moveTo(0,0); ctx.lineTo(Math.cos(rotation) * radius * 0.4, Math.sin(rotation) * radius * 0.4);
    ctx.stroke();
  
    ctx.restore();
}


export function drawBarrageWarning(ctx: CanvasRenderingContext2D, position: Vector, radius: number, progress: number, now: number) {
  ctx.save();
  ctx.translate(position.x, position.y);
  
  const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
  const color = `rgba(239, 68, 68, ${0.5 + progress * 0.5})`; // red-500
  const flicker = Math.random() > 0.9 ? 0.8 : 1.0;
  
  ctx.strokeStyle = color;
  ctx.fillStyle = `rgba(239, 68, 68, ${0.1 + progress * 0.2 * flicker})`;
  ctx.shadowColor = color;
  ctx.shadowBlur = 25 * progress;
  
  // Outer shrinking ring
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, radius + 20 * (1-easedProgress), 0, Math.PI * 2);
  ctx.stroke();

  // Main filled circle
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner rotating hazard lines
  const rotation = now / 200;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.8 * flicker;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const angle = rotation + i * (Math.PI / 6);
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  ctx.stroke();

  ctx.restore();
}

export function drawEffectZones(ctx: CanvasRenderingContext2D, zones: EffectZone[], now: number) {
    zones.forEach(zone => {
        if (zone.type === 'chrono') {
            const elapsed = now - zone.createdAt;
            const progress = elapsed / zone.duration;
            const alpha = Math.sin(progress * Math.PI) * 0.5; // Fade in and out

            ctx.save();
            ctx.translate(zone.position.x, zone.position.y);
            
            const color = `rgba(168, 85, 247, ${alpha})`; // purple-500
            ctx.fillStyle = color;
            ctx.shadowColor = '#a855f7';
            ctx.shadowBlur = 30;

            ctx.beginPath();
            ctx.arc(0, 0, zone.radius, 0, Math.PI * 2);
            ctx.fill();

            // Ripples
            ctx.strokeStyle = `rgba(221, 214, 254, ${alpha * 1.2})`; // violet-200
            ctx.lineWidth = 2;
            const rippleCount = 3;
            for(let i=0; i < rippleCount; i++) {
                const rippleProgress = (elapsed/1000 + i/rippleCount) % 1;
                ctx.beginPath();
                ctx.globalAlpha = (1 - rippleProgress) * alpha;
                ctx.arc(0,0, zone.radius * rippleProgress, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }
    });
}

export function drawBoss(ctx: CanvasRenderingContext2D, bossData: Boss, now: number, isTimeStopped: boolean) {
  const { position, turretAngle, size, color, status, spawnTime, lastHitTime, angle, attackState, statusEffects } = bossData;

  ctx.save();
  ctx.translate(position.x, position.y);

  if (status === 'spawning' && spawnTime) {
    const spawnProgress = Math.min(1, (now - spawnTime) / SPAWN_DURATION);
    const easeOut = (t: number) => t * (2 - t);
    ctx.globalAlpha = easeOut(spawnProgress);
  }

  // Last Stand charging effect
  if (attackState.currentAttack === 'lastStand' && attackState.phase === 'telegraphing') {
    const chargeProgress = (now - attackState.phaseStartTime) / (attackState.attackData?.telegraphDuration || 6500);
    const easedProgress = chargeProgress * chargeProgress; // Ease-in quad

    // 1. Inward-pulling particles/arcs
    const particleCount = 40;
    const maxRadius = LAST_STAND_RADIUS * 1.2;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15;
    for (let i = 0; i < particleCount; i++) {
        const seed = (bossData.id.charCodeAt(i % bossData.id.length) * (i + 1));
        const angle = (seed * 137.5 + (now / 20)) * (Math.PI / 180); // Golden angle + rotation
        const startDist = maxRadius + (seed % (maxRadius / 4));
        const currentDist = startDist * (1 - easedProgress);
        
        if (currentDist > size.width / 2) {
            const x = Math.cos(angle) * currentDist;
            const y = Math.sin(angle) * currentDist;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x * 0.9, y * 0.9); // Tail effect
            ctx.lineWidth = 1 + (seed % 2);
            ctx.strokeStyle = `rgba(255, 150, 150, ${0.6 * (1 - chargeProgress)})`;
            ctx.stroke();
        }
    }

    // 2. Boss chassis pulsing glow
    const pulseFreq = 200 - (150 * easedProgress);
    const pulse = 1 + Math.sin(now / pulseFreq) * easedProgress * 0.5;
    const glowRadius = (size.width / 2) * pulse;
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
    glowGradient.addColorStop(0, `rgba(255, 255, 255, ${easedProgress * 0.9})`);
    glowGradient.addColorStop(0.5, `rgba(255, 100, 100, ${easedProgress * 0.7})`);
    glowGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius * 1.5, 0, Math.PI * 2); // A bit larger for a softer effect
    ctx.fill();

    ctx.shadowBlur = 0;
  }
  
  ctx.rotate(degToRad(angle || 0));

  // --- NEW BOSS VISUALS ---
  const drawBossBody = () => {
    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 25; ctx.shadowOffsetY = 15;

    // Side Treads
    const treadWidth = size.width * 0.25;
    const treadHeight = size.height * 1.05;
    ctx.fillStyle = '#1c1c1c'; ctx.strokeStyle = '#4a4a4a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-size.width / 2, -treadHeight / 2, treadWidth, treadHeight, 8); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(size.width / 2 - treadWidth, -treadHeight / 2, treadWidth, treadHeight, 8); ctx.fill(); ctx.stroke();
    
    // Main Hull (Hexagonal)
    const hullWidth = size.width * 0.6;
    const hullHeight = size.height * 0.9;
    ctx.fillStyle = '#3a3a3a'; ctx.strokeStyle = '#6b6b6b'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -hullHeight / 2);
    ctx.lineTo(hullWidth / 2, -hullHeight / 2 * 0.5);
    ctx.lineTo(hullWidth / 2, hullHeight / 2 * 0.5);
    ctx.lineTo(0, hullHeight / 2);
    ctx.lineTo(-hullWidth / 2, hullHeight / 2 * 0.5);
    ctx.lineTo(-hullWidth / 2, -hullHeight / 2 * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Upper Deck
    const deckRadius = size.width * 0.25;
    ctx.fillStyle = '#5a5a5a';
    ctx.beginPath(); ctx.arc(0, 0, deckRadius, 0, Math.PI * 2); ctx.fill();
    ctx.stroke();

    // Glowing "Eye"
    const eyePulse = 1 + Math.sin(now / 150) * 0.1;
    const eyeRadius = deckRadius * 0.6 * eyePulse;
    const eyeGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, eyeRadius);
    eyeGradient.addColorStop(0, `rgba(255, 150, 150, 1)`);
    eyeGradient.addColorStop(0.5, `rgba(239, 68, 68, 0.8)`);
    eyeGradient.addColorStop(1, `rgba(127, 29, 29, 0.5)`);
    ctx.fillStyle = eyeGradient;
    ctx.shadowColor = color; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2); ctx.fill();
    
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // Turret Rotation Point
    ctx.save();
    ctx.rotate(degToRad(turretAngle - (angle || 0)));
    
    // Main Cannon
    const barrelLength = size.height * 0.8;
    const barrelWidth = 18;
    const barrelBaseWidth = 35;
    const barrelBaseHeight = 30;
    
    ctx.fillStyle = '#2a2a2a'; ctx.strokeStyle = '#6b6b6b'; ctx.lineWidth = 2;
    // Base of the cannon
    ctx.beginPath(); ctx.roundRect(-barrelBaseWidth / 2, -barrelBaseHeight / 2, barrelBaseWidth, barrelBaseHeight, 4); ctx.fill(); ctx.stroke();
    // Barrel
    ctx.beginPath(); ctx.rect(-barrelWidth / 2, -barrelLength, barrelWidth, barrelLength - barrelBaseHeight / 2); ctx.fill(); ctx.stroke();
    // Muzzle break
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath(); ctx.rect(-barrelWidth * 0.7, -barrelLength - 10, barrelWidth * 1.4, 10); ctx.fill(); ctx.stroke();
    
    ctx.restore();
  };

  drawBossBody();

  if (lastHitTime && now - lastHitTime < HIT_FLASH_DURATION) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - (now - lastHitTime) / HIT_FLASH_DURATION)})`;
    ctx.fillRect(-size.width / 2, -size.height / 2, size.width, size.height);
    ctx.restore();
  }
  
    // Draw poison effect on boss
    // FIX: Use a type guard to safely access `stacks` only on PoisonStatusEffect.
    const poisonEffectOnBoss = statusEffects?.find(e => e.type === 'poison');
    if (poisonEffectOnBoss && poisonEffectOnBoss.type === 'poison') {
        const alpha = 0.5 + Math.sin(now / 100) * 0.2;
        ctx.fillStyle = `rgba(132, 204, 22, ${alpha})`; // lime-500
        for (let i = 0; i < poisonEffectOnBoss.stacks * 3; i++) { // More particles for boss
            const particleProgress = ((now / (800 + (i*50))) + (i * 0.3)) % 1;
            const x = (Math.random() - 0.5) * size.width;
            const y = -size.height / 2 + (size.height * particleProgress);
            ctx.fillRect(x, y, 3, 3);
        }
    }
    
    // Draw stun effect on boss
    const stunEffect = statusEffects?.find(e => e.type === 'stun');
    if (stunEffect) {
        drawStunEffect(ctx, now, stunEffect, size);
    }

    if (isTimeStopped) {
        ctx.strokeStyle = 'rgba(150, 150, 150, 0.7)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 10;
        ctx.strokeRect(-size.width/2 - 2, -size.height/2 - 2, size.width + 4, size.height + 4);
    }
  ctx.restore();
}


export function drawTelegraphs(ctx: CanvasRenderingContext2D, telegraphs: Telegraph[], now: number) {
  telegraphs.forEach(tele => {
    const elapsed = now - tele.createdAt;
    const progress = elapsed / tele.duration;
    if (progress > 1) return;

    const alpha = 0.4 + Math.sin(now / 100) * 0.15;
    const color = `rgba(239, 68, 68, ${alpha})`; // red-500
    
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 20;

    if (tele.type === 'circle' && tele.radius) {
      ctx.beginPath();
      ctx.arc(tele.position.x, tele.position.y, tele.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (tele.type === 'rect' && tele.width && tele.height) {
      ctx.translate(tele.position.x, tele.position.y);
      if(tele.angle) ctx.rotate(degToRad(tele.angle));
      ctx.fillRect(-tele.width / 2, -tele.height / 2, tele.width, tele.height);
    }
    
    ctx.restore();
  });
}

export function drawTimeStopOverlay(ctx: CanvasRenderingContext2D, now: number) {
    ctx.save();
    ctx.globalAlpha = 0.15 + Math.sin(now / 200) * 0.05;
    ctx.font = '12px Orbitron';
    ctx.fillStyle = '#9ca3af'; // cool-gray-400
  
    for (let i = 0; i < 20; i++) {
      const x = (now / 5 + i * 139) % (ctx.canvas.width + 100) - 50;
      const y = (now / 8 + i * 157) % (ctx.canvas.height + 100) - 50;
      const rotation = (now / 300 + i * 25) % (Math.PI * 2);
      const text = `T-${(now + i*1337) % 9999}`.padStart(5, '0');
  
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  
    ctx.restore();
  }
export function drawDamageNumbers(ctx: CanvasRenderingContext2D, damageNumbers: DamageNumber[], now: number) {
  damageNumbers.forEach(dn => {
    const elapsed = now - dn.createdAt;
    const progress = elapsed / dn.duration;
    if (progress > 1) return;

    const yOffset = -40 * (1 - Math.pow(1 - progress, 2)); // Ease-out quad for upward movement
    const alpha = 1 - progress * progress; // Fade out

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 18px Orbitron';
    ctx.fillStyle = dn.color;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 5;
    ctx.textAlign = 'center';
    ctx.fillText(dn.text, dn.position.x, dn.position.y + yOffset);
    ctx.restore();
  });
}

export function drawDamageIndicators(ctx: CanvasRenderingContext2D, indicators: DamageIndicator[], player: Tank, now: number) {
    if (player.status !== 'active') return;

    indicators.forEach(ind => {
        const elapsed = now - ind.createdAt;
        const progress = elapsed / ind.duration;
        if (progress > 1) return;

        const alpha = Math.sin((1-progress) * Math.PI); // Fade in and out

        ctx.save();
        ctx.translate(player.position.x, player.position.y);
        ctx.rotate((ind.angle * Math.PI / 180));

        const radius = player.size.height * 0.8;
        const arcSize = Math.PI / 4;

        ctx.beginPath();
        ctx.arc(0, 0, radius, -arcSize, arcSize);
        
        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 15;
        ctx.stroke();

        ctx.restore();
    });
}

export function drawChronoShards(ctx: CanvasRenderingContext2D, shards: { position: Vector, angle: number, createdAt: number }[], now: number) {
    shards.forEach(shard => {
        ctx.save();
        ctx.translate(shard.position.x, shard.position.y);
        ctx.rotate(degToRad(shard.angle - 90));
        drawSingleChronoShard(ctx, now, shard.createdAt);
        ctx.restore();
    });
}