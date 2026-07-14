'use client';
import { Column } from '@umami/react-zen';
import { useEffect } from 'react';
import { BoardControls } from '@/app/(main)/boards/[boardId]/BoardControls';
import { BoardViewBody } from '@/app/(main)/boards/[boardId]/BoardViewBody';
import { Empty } from '@/components/common/Empty';
import { PageBody } from '@/components/common/PageBody';
import { useBoard, useMessages, useNavigation } from '@/components/hooks';
import { DashboardProvider } from './DashboardProvider';
import { DashboardViewHeader } from './DashboardViewHeader';

function DashboardContent() {
  const { board } = useBoard();
  const { t, messages } = useMessages();
  const rows = board?.parameters?.rows ?? [];
  const hasComponents = rows.some(row => row.columns?.some(column => !!column.component));

  if (!hasComponents) {
    return (
      <Column gap="4" padding="4">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {[
            {
              title: 'Ingresos del periodo',
              value: '—',
              sub: 'Conecta una fuente para ver datos',
              bars: [30, 50, 40, 70, 55, 80, 65],
            },
            {
              title: 'Tasa de conversión',
              value: '— %',
              sub: 'Configura objetivos para medir',
              bars: [20, 35, 30, 45, 40, 60, 50],
            },
            {
              title: 'Visitantes únicos',
              value: '—',
              sub: 'Agrega un sitio web para comenzar',
              bars: [40, 60, 50, 75, 65, 85, 70],
            },
            {
              title: 'Canales principales',
              value: '—',
              sub: 'Analiza el origen de tu tráfico',
              bars: [25, 45, 35, 55, 45, 65, 55],
            },
          ].map(card => (
            <div
              key={card.title}
              style={{
                backgroundColor: 'var(--surface-base)',
                border: '1px solid var(--border-default)',
                borderRadius: 10,
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {card.title}
                  </span>
                  <span
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {card.value}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    backgroundColor: 'var(--sm-brand-light)',
                    color: 'var(--sm-brand)',
                    borderRadius: 4,
                    padding: '3px 7px',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  En desarrollo
                </span>
              </div>

              {/* Skeleton bar chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 36 }}>
                {card.bars.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      backgroundColor: 'var(--border-default)',
                      borderRadius: 2,
                    }}
                  />
                ))}
              </div>

              <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{card.sub}</span>
            </div>
          ))}
        </div>

        <Empty message={t(messages.emptyDashboard)} />
      </Column>
    );
  }

  return <BoardViewBody />;
}

export function DashboardViewPage() {
  const { teamId, router } = useNavigation();

  useEffect(() => {
    if (teamId) {
      router.replace('/dashboard');
    }
  }, [teamId, router]);

  if (teamId) {
    return null;
  }

  return (
    <DashboardProvider>
      <PageBody>
        <Column>
          <DashboardViewHeader />
          <BoardControls />
          <DashboardContent />
        </Column>
      </PageBody>
    </DashboardProvider>
  );
}
