const prefixes = ['Cypher', 'Glitch', 'Void', 'Data', 'Hex', 'Neuro', 'Synth', 'Zero', 'Ghost', 'Chrome', 'Blade', 'Pulse'];
const suffixes = ['Runner', 'Specter', 'Byte', 'Jacker', 'Mancer', 'Drifter', 'Warden', 'Freak', 'Nomad', 'Tech', 'Rogue', 'Hunter'];
const numbers = () => Math.floor(Math.random() * 90) + 10; // 10-99

export const generateUsername = (): string => {
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${prefix}_${suffix}${numbers()}`;
};
