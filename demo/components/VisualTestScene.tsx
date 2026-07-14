import { MetalFx } from '../../src';

const buttonStyle = {
  width: 140,
  height: 40,
  border: '1px solid rgba(255,255,255,0.22)',
  borderRadius: 20,
  background: '#16191f',
  color: '#f7f9fc',
  font: '600 14px/1 Inter, system-ui, sans-serif'
};

const circleStyle = {
  width: 40,
  height: 40,
  border: '1px solid rgba(255,255,255,0.22)',
  borderRadius: '50%',
  background: '#16191f',
  color: '#f7f9fc',
  font: '600 16px/1 Inter, system-ui, sans-serif'
};

function FixtureCard({ children, theme }: { children: React.ReactNode; theme: 'dark' | 'light' }) {
  const light = theme === 'light';
  return (
    <section
      style={{
        alignItems: 'center',
        background: light ? '#f4f6f8' : '#111419',
        border: `1px solid ${light ? '#d8dde3' : '#2b3038'}`,
        borderRadius: 16,
        display: 'flex',
        gap: 24,
        height: 112,
        justifyContent: 'center',
        width: 390
      }}
      aria-label={`${theme} visual treatment`}
    >
      {children}
    </section>
  );
}

/** Dedicated, query-selected demo scene for the single Chromium visual baseline. */
export function VisualTestScene() {
  return (
    <main
      data-visual-test-scene
      style={{
        alignItems: 'center',
        background: '#080a0d',
        boxSizing: 'border-box',
        display: 'grid',
        gap: 16,
        gridTemplateColumns: 'repeat(2, 390px)',
        minHeight: '100vh',
        padding: 24,
        placeContent: 'center'
      }}
    >
      <FixtureCard theme="dark">
        <MetalFx paused preset="chromatic" theme="dark">
          <button type="button" style={buttonStyle}>
            Chromatic
          </button>
        </MetalFx>
        <MetalFx paused preset="gold" theme="dark" variant="circle">
          <button type="button" style={circleStyle} aria-label="Gold action">
            +
          </button>
        </MetalFx>
      </FixtureCard>
      <FixtureCard theme="light">
        <MetalFx paused preset="silver" theme="light">
          <button
            type="button"
            style={{ ...buttonStyle, background: '#ffffff', borderColor: '#b8c0ca', color: '#19212b' }}
          >
            Silver
          </button>
        </MetalFx>
        <MetalFx paused preset="chromatic" theme="light" variant="circle">
          <button
            type="button"
            style={{ ...circleStyle, background: '#ffffff', borderColor: '#b8c0ca', color: '#19212b' }}
            aria-label="Light action"
          >
            +
          </button>
        </MetalFx>
      </FixtureCard>
    </main>
  );
}
