'use client';
import { LoginForm } from './LoginForm';

export function LoginPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--surface-raised)' }}>
      {/* Left panel — branding */}
      <div
        style={{
          display: 'none',
          flex: '0 0 45%',
          background: 'linear-gradient(145deg, var(--sm-brand-dark) 0%, var(--sm-brand) 60%, oklch(62% 0.13 195) 100%)',
          padding: '48px 52px',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#fff',
        }}
        className="sm-login-panel"
      >
        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width={32} height={32} viewBox="0 0 24 24" fill="white">
            <rect x="2" y="12" width="4" height="8" rx="1" opacity="0.5" />
            <rect x="8" y="7" width="4" height="13" rx="1" opacity="0.75" />
            <rect x="14" y="3" width="4" height="17" rx="1" />
            <path d="M3 11 L9 7.5 L15 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.03em' }}>SmallMetrics</span>
        </div>

        {/* Hero copy */}
        <div>
          <p style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.03em' }}>
            Analítica de negocio<br />sin complicaciones.
          </p>
          <p style={{ fontSize: 15, opacity: 0.82, lineHeight: 1.6, maxWidth: 340 }}>
            Métricas claras para tomar mejores decisiones. Pensado para equipos pequeños que quieren crecer con datos reales.
          </p>
        </div>

        {/* Feature highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { icon: '📊', title: 'Reportes en tiempo real', desc: 'Visualiza el rendimiento de tus sitios y campañas al instante.' },
            { icon: '🎯', title: 'Objetivos y conversiones', desc: 'Define metas de negocio y mide cuánto te acercas a ellas.' },
            { icon: '💡', title: 'Insights accionables', desc: 'Entiende qué canales, páginas y audiencias generan más valor.' },
          ].map(f => (
            <div key={f.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{f.icon}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{f.title}</p>
                <p style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p style={{ fontSize: 12, opacity: 0.55 }}>
          © {new Date().getFullYear()} SmallMetrics — Analytics for growing businesses
        </p>
      </div>

      {/* Right panel — form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <LoginForm />
      </div>

      <style>{`
        @media (min-width: 768px) {
          .sm-login-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
