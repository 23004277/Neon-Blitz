
export type ChassisType = 'vector-01' | 'rogue-scout' | 'iron-bastion' | 'goliath-prime' | 'goliath-prime-overdrive' | 'phantom-weaver' | 'titan-ogre' | 'volt-strider' | 'inferno-cobra' | 'crystal-vanguard';

// FIX: Removed self-import which was causing declaration conflicts.
// FIX: Replaced incorrect component code with all necessary type definitions for the application.
export type Screen = 'loading' | 'main-menu' | 'settings' | 'difficulty-selection' | 'game' | 'duel-selection' | 'sandbox-selection' | 'hangar';

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

export interface Barrel {
    id: string;
    position: Vector;
    radius: number;
    health: number;
    maxHealth: number;
    createdAt: number;
}

export type GameMode = 'campaign' | 'duel' | 'sandbox';

export interface DuelConfig {
  opponentId: string;
  opponentType: 'tank' | 'boss';
  tier?: 'basic' | 'intermediate';
  bossType?: 'goliath' | 'viper' | 'sentinel';
  chassis?: 'vector-01' | 'rogue-scout' | 'iron-bastion' | 'goliath-prime' | 'phantom-weaver' | 'titan-ogre' | 'volt-strider' | 'inferno-cobra' | 'crystal-vanguard'; // Added chassis
  opponentName: string;
}

export interface SandboxConfig {
  characterId: 'vector-01' | 'rogue-scout' | 'iron-bastion' | 'goliath-prime' | 'phantom-weaver' | 'titan-ogre' | 'volt-strider' | 'inferno-cobra' | 'crystal-vanguard';
}

export interface GameConfig {
  mode: GameMode;
  duelConfig?: DuelConfig;
  sandboxConfig?: SandboxConfig;
}

export type ColorStyle = 'solid' | 'gradient' | 'neon' | 'chrome';

export interface Settings {
  sound: boolean;
  music: boolean;
  soundVolume: number;
  screenShake: boolean;
  difficulty: Difficulty;
  controls: ControlScheme;
  language: Language;
  playerName: string;
  playerColor: string;
  playerSecondaryColor: string;
  playerColorStyle: ColorStyle;
  credits: number;
  unlockedChassis: ChassisType[];
  equippedChassis: ChassisType;
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
  velocity: Vector; // Added explicit velocity for better physics
  createdAt: number; // Added to track lifespan
  size: { width: number; height: number };
  isBarrage?: boolean;
  isHoming?: boolean;
  targetId?: string;
  turnRate?: number;
  maxLifetime?: number; // New: Max duration before self-destruct
  damage?: number;
  blastRadius?: number; // Added for AOE
  isFrozen?: boolean;
  isChronoShard?: boolean;
  isBossOrb?: boolean;
  isVampiric?: boolean; // New: Heals owner on hit
  isNapalm?: boolean; // New: Creates fire zone on impact
  isPoisonContainer?: boolean; // New: Creates poison zone on impact
  color?: string;
  secondaryColor?: string;
  colorStyle?: ColorStyle;
}

export type PowerUpType = 'dualCannon' | 'shield' | 'regensule' | 'reflectorField' | 'lifeLeech' | 'homingMissiles';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  position: Vector;
  spawnTime: number; // For floating animations
}

export interface Animation {
  id:string;
  type: 'muzzleFlash' | 'hit' | 'explosion' | 'shieldHit' | 'shieldBreak' | 'barrageImpact' | 'laneAttack' | 'mortarStrike' | 'finalBlast' | 'poisonTick' | 'homingExplosion' | 'chronoShardImpact' | 'dashTrail' | 'teleport' | 'railgunBeam' | 'shockwave' | 'mineExplosion' | 'lightning' | 'transformFlash' | 'transformCharge' | 'orbitalBeam';
  createdAt: number;
  duration: number;
  position: Vector;
  angle?: number;
  color?: string;
  secondaryColor?: string;
  colorStyle?: ColorStyle;
  width?: number;
  height?: number;
  opacity?: number;
  targetPosition?: Vector; // For beams and lightning
}

export type AbilityId = 'overdrive' | 'cyberBeam' | 'missileBarrage' | 'toxicRounds' | 'teslaStorm' | 'damageConverter' | 'shockwave' | 'poisonGas' | 'mortarVolley' | 'laserSweep' | 'scatterMines' | 'nanoSwarm' | 'phaseShift' | 'flamethrower' | 'chainLightning' | 'prismGuard' | 'lightningDash' | 'emOverload' | 'staticVeil' | 'voltLock' | 'overdriveCore' | 'conductiveField' | 'counterSurge';

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
  firedCount?: number; // Added for rapid fire tracking
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

export interface ConductiveStatusEffect {
  type: 'conductive';
  ownerId: string;
  startTime: number;
  duration: number;
}

export interface VoltLockStatusEffect {
  type: 'voltLock';
  ownerId: string;
  startTime: number;
  duration: number;
}

export type StatusEffect = PoisonStatusEffect | StunStatusEffect | ConductiveStatusEffect | VoltLockStatusEffect;


export interface RenderableEntity {
  id: string;
  position: Vector;
  color: string;
  secondaryColor?: string;
  colorStyle?: ColorStyle;
}

export interface Tank extends RenderableEntity {
  name: string;
  type: 'player' | 'enemy';
  status: 'spawning' | 'active' | 'dying' | 'dead';
  tier?: 'basic' | 'intermediate';
  bossType?: 'goliath' | 'viper' | 'sentinel'; // Added to Tank for Sandbox mode players
  chassis?: ChassisType; // Added for specific visuals
  spawnTime?: number;
  position: Vector;
  velocity: Vector;
  angle: number;
  turretAngle: number;
  size: { width: number; height: number };
  health: number;
  maxHealth: number;
  color: string;
  secondaryColor?: string;
  colorStyle?: ColorStyle;
  score: number;
  kills: number;
  deaths: number;
  deathTime?: number;
  respawnTime?: number;
  activePowerUps?: PowerUpType[];
  powerUpExpireTime?: number;
  shieldHealth?: number;
  path?: Vector[];
  patrolTarget?: Vector;
  lastHitTime?: number;
  isInvulnerable?: boolean;
  statusEffects?: StatusEffect[];
  homingMissileCount?: number;
  damageConverterCharge?: number; // Stores energy from damage taken
  abilities?: Ability[];
  
  // Volt Strider Properties
  dashCharges?: number;
  maxDashCharges?: number;
  isStealthed?: boolean;
  stealthStartTime?: number;
  isParrying?: boolean;
  parryStartTime?: number;
  storedEnergy?: number;
  voltLockTargetId?: string;
  isExhausted?: boolean;
  exhaustionStartTime?: number;
  
  // AI Properties
  lastFireTime?: number;
  aiMode?: 'engage' | 'strafe' | 'flank';
  aiStrafeDir?: number;
  aiStateTimer?: number;
  critChance?: number;
  critMultiplier?: number;
}

export interface Telegraph {
  id: string;
  type: 'circle' | 'rect' | 'line';
  position: Vector;
  radius?: number;
  width?: number;
  height?: number;
  angle?: number;
  createdAt: number;
  duration: number;
  color?: string;
  secondaryColor?: string;
  colorStyle?: ColorStyle;
  targetPosition?: Vector; // For lines
}

export interface EffectZone {
  id: string;
  type: 'chrono' | 'poison' | 'fissure' | 'fire' | 'conductive';
  position: Vector;
  radius: number;
  createdAt: number;
  duration: number;
  lastTick?: number; // For DoT logic
  ownerId?: string; // Added to track who created the zone
}

export interface Minion extends RenderableEntity {
  angle: number; // Gun angle
  size: { width: number; height: number };
  health: number;
  maxHealth: number;
  status: 'spawning' | 'active' | 'dying' | 'dead';
  spawnTime: number;
  color: string;
  secondaryColor?: string;
  colorStyle?: ColorStyle;
  deathTime?: number;
  lastHitTime?: number;
  lastFireTime?: number;
  statusEffects?: StatusEffect[];
}

export interface Boss extends RenderableEntity {
  name: string;
  bossType: 'goliath' | 'viper' | 'sentinel';
  velocity: Vector; // Added for movement physics
  angle: number; // Body angle
  patrolTarget?: Vector;
  size: { width: number; height: number };
  health: number;
  maxHealth: number;
  turretAngle: number;
  status: 'spawning' | 'active' | 'dying' | 'dead';
  spawnTime?: number;
  deathTime?: number;
  color: string;
  secondaryColor?: string;
  colorStyle?: ColorStyle;
  lastHitTime?: number;
  lastFireTime?: number;
  hasUsedLastStand?: boolean;
  statusEffects?: StatusEffect[];
  shieldHealth?: number; // Added for consistency
  shieldSegments?: { angle: number, health: number, maxHealth: number, active: boolean }[]; // For Sentinel
  abilities?: Ability[]; // Added for unified ability system
  
  // Common properties for Tank compatibility
  type?: 'player' | 'enemy';
  score?: number;
  kills?: number;
  deaths?: number;
  chassis?: ChassisType;

  // Volt Strider Properties (for Boss compatibility)
  dashCharges?: number;
  maxDashCharges?: number;
  isStealthed?: boolean;
  stealthStartTime?: number;
  isParrying?: boolean;
  parryStartTime?: number;
  storedEnergy?: number;
  voltLockTargetId?: string;
  isExhausted?: boolean;
  exhaustionStartTime?: number;
  isInvulnerable?: boolean;
  critChance?: number;
  critMultiplier?: number;

  attackState: {
    currentAttack: 'none' | 'mortarVolley' | 'laserSweep' | 'scatterMines' | 'lastStand' | 'summonMinions' | 'shockwave' | 'poisonGas';
    phase: 'idle' | 'telegraphing' | 'attacking' | 'recovering' | 'charging';
    phaseStartTime: number;
    attackData?: {
      telegraphDuration?: number;
      attackDuration?: number;
      recoveryDuration?: number;
      targets?: Vector[];
      sweepAngleStart?: number;
      sweepAngleEnd?: number;
      attackOrigin?: Vector;
      attackAngle?: number;
      targetPosition?: Vector; // For locking
      telegraphId?: string; 
      telegraphIds?: string[]; // For multiple scatter mines
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
  isCritical?: boolean;
}

export interface DamageIndicator {
    id: string;
    angle: number; // angle from player to damage source
    createdAt: number;
    duration: number;
}

export interface CombatText {
    id: string;
    text: string;
    createdAt: number;
    duration: number;
    color: string;
    isCritical?: boolean;
}

export interface KillFeedMessage {
    id: string;
    killerName: string;
    victimName: string;
    killerColor: string;
    victimColor: string;
    createdAt: number;
}

export interface CutsceneState {
  active: boolean;
  phase: 'intro' | 'dialogue' | 'transform' | 'outro';
  startTime: number;
  dialogueText: string;
  dialogueIndex: number;
  targetCamera: { x: number, y: number, zoom: number };
}

export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// Minimal state for the React Render loop (UI only)
export interface UIState {
    playerHealth: number;
    playerMaxHealth: number;
    playerShield: number;
    playerScore: number;
    playerKills: number;
    wave: number;
    enemiesRemaining: number;
    bossHealth?: number;
    bossMaxHealth?: number;
    bossName?: string;
    gameOver: boolean;
    duelWon: boolean;
    abilities: Ability[];
    damageConverterCharge: number;
    showUpgradeScreen?: boolean;
    availableUpgrades?: UpgradeOption[];
}
