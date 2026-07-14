export type MaterialLabEnvironment =
  | 'studio-sweep'
  | 'warm-cool-split'
  | 'moving-softbox'
  | 'dark-tunnel'
  | 'spectral-wash';

export const MATERIAL_ENVIRONMENTS: readonly {
  animated: boolean;
  id: MaterialLabEnvironment;
  label: string;
  surface: string;
}[] = [
  {
    id: 'studio-sweep',
    label: 'Studio sweep',
    animated: false,
    surface: 'linear-gradient(135deg, #2a2e30, #111315 62%, #5a5d5e)'
  },
  {
    id: 'warm-cool-split',
    label: 'Warm / cool split',
    animated: false,
    surface: 'linear-gradient(110deg, #512317 0 48%, #172b51 52%)'
  },
  {
    id: 'moving-softbox',
    label: 'Moving softbox',
    animated: true,
    surface: 'radial-gradient(circle at 20% 30%, #dfe4e4, #1b1d20 36%, #0e1012 72%)'
  },
  {
    id: 'dark-tunnel',
    label: 'Dark tunnel',
    animated: false,
    surface: 'radial-gradient(ellipse at center, #2a3036, #0d0f11 68%)'
  },
  {
    id: 'spectral-wash',
    label: 'Spectral wash',
    animated: true,
    surface: 'linear-gradient(120deg, #241638, #18394d, #512a1e)'
  }
];

export function findMaterialEnvironment(id: string | null, fallback: MaterialLabEnvironment = 'studio-sweep') {
  return (
    MATERIAL_ENVIRONMENTS.find((environment) => environment.id === id) ??
    MATERIAL_ENVIRONMENTS.find((environment) => environment.id === fallback) ??
    MATERIAL_ENVIRONMENTS[0]
  );
}
