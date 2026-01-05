
// FIX: Removed self-import which was causing declaration conflicts.
// FIX: Replaced incorrect component code with all necessary type definitions for the application.
export type Screen = 'loading' | 'main-menu' | 'settings' | 'difficulty-selection' | 'game' | 'duel-selection';

export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

export enum ControlScheme {
  WASD = 'WASD',
  Arrows = 'Arrow Keys',
}

export enum Language {
  English = 'English',
}

export type GameMode = 'campaign' | 'duel';

export interface DuelConfig {
  opponentId: string;
  opponentType: 'tank' | 'boss';
  tier?: 'basic' | 'intermediate';
  opponentName: string;
}

export interface GameConfig {
  mode: GameMode;
  duelConfig?: DuelConfig;
}

export interface Settings {
  sound: boolean;
  music: boolean;
  soundVolume: number;
  screenShake: boolean;
  difficulty: Difficulty;
  controls: ControlScheme;
  language: Language;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export interface Vector {
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Projectile {
  id: string;
  ownerId: string;
  position: Vector;
  angle: number;
  size: { width: number; height: number };
  isBarrage?: boolean;
  isHoming?: boolean;
  targetId?: string;
  turnRate?: number;
  damage?: number;
  isFrozen?: boolean;
  isChronoShard?: boolean;
  isBossOrb?: boolean;
}

export type PowerUpType = 'dualCannon' | 'shield' | 'regensule' | 'reflectorField' | 'lifeLeech' | 'homingMissiles';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  position: Vector;
}

export interface Animation {
  id:string;
  type: 'muzzleFlash' | 'hit' | 'explosion' | 'shieldHit' | 'shieldBreak' | 'barrageImpact' | 'laneAttack' | 'mortarStrike' | 'finalBlast' | 'poisonTick' | 'homingExplosion' | 'chronoShardImpact';
  createdAt: number;
  duration: number;
  position: Vector;
  angle?: number;
  color?: string;
  width?: number;
  height?: number;
}

export type AbilityId = 'overdrive' | 'cyberBeam' | 'barrage' | 'chronoBubble' | 'toxicRounds' | 'timeStop';

export interface Ability {
  id: AbilityId;
  name: string;
  keyBinding: string;
  state: 'ready' | 'charging' | 'chargingHold' | 'active' | 'cooldown';
  duration: number;
  cooldown: number;
  startTime: number;
  mastered?: boolean;
  chargeDuration?: number;
  chargeStartTime?: number;
}

export interface PoisonStatusEffect {
  type: 'poison';
  ownerId: string;
  stacks: number;
  lastApplied: number;
  duration: number; // Duration is refreshed on each application
  tickDamage: number;
  tickInterval: number;
  lastTickTime: number;
}

export interface StunStatusEffect {
  type: 'stun';
  ownerId: string;
  startTime: number;
  duration: number;
}

export type StatusEffect = PoisonStatusEffect | StunStatusEffect;


export interface Tank {
  id: string;
  name: string;
  type: 'player' | 'enemy';
  status: 'spawning' | 'active' | 'dying';
  tier?: 'basic' | 'intermediate';
  spawnTime?: number;
  position: Vector;
  velocity: Vector;
  angle: number;
  turretAngle: number;
  size: { width: number; height: number };
  health: number;
  maxHealth: number;
  color: string;
  score: number;
  kills: number;
  deaths: number;
  deathTime?: number;
  respawnTime?: number;
  activePowerUp?: PowerUpType | null;
  powerUpExpireTime?: number;
  shieldHealth?: number;
  path?: Vector[];
  patrolTarget?: Vector;
  lastHitTime?: number;
  isInvulnerable?: boolean;
  statusEffects?: StatusEffect[];
  homingMissileCount?: number;
}

export interface Telegraph {
  id: string;
  type: 'circle' | 'rect';
  position: Vector;
  radius?: number;
  width?: number;
  height?: number;
  angle?: number;
  createdAt: number;
  duration: number;
}

export interface EffectZone {
  id: string;
  type: 'chrono';
  position: Vector;
  radius: number;
  createdAt: number;
  duration: number;
}

export interface Minion {
  id: string;
  position: Vector;
  angle: number; // Gun angle
  health: number;
  maxHealth: number;
  status: 'spawning' | 'active' | 'dying';
  spawnTime: number;
  deathTime?: number;
  lastHitTime?: number;
  lastFireTime?: number;
  statusEffects?: StatusEffect[];
}

export interface Boss {
  id: string;
  name: string;
  position: Vector;
  angle?: number;
  patrolTarget?: Vector;
  size: { width: number; height: number };
  health: number;
  maxHealth: number;
  turretAngle: number;
  status: 'spawning' | 'active' | 'dying';
  spawnTime?: number;
  deathTime?: number;
  color: string;
  lastHitTime?: number;
  hasUsedLastStand?: boolean;
  statusEffects?: StatusEffect[];
  attackState: {
    currentAttack: 'none' | 'mortarVolley' | 'laserSweep' | 'multiLane' | 'xPattern' | 'lastStand' | 'summonMinions';
    phase: 'idle' | 'telegraphing' | 'attacking';
    phaseStartTime: number;
    attackData?: {
      telegraphDuration?: number;
      attackDuration?: number;
      targets?: Vector[];
      sweepAngleStart?: number;
      attackOrigin?: Vector;
      attackAngle?: number;
    };
  };
}

export interface DamageNumber {
  id: string;
  text: string;
  position: Vector;
  createdAt: number;
  duration: number;
  color: string;
}

export interface DamageIndicator {
    id: string;
    angle: number; // angle from player to damage source
    createdAt: number;
    duration: number;
}