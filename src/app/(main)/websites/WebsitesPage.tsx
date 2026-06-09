'use client';
import { Column } from '@umami/react-zen';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useLoginQuery, useMessages, useNavigation, useTeamMembersQuery } from '@/components/hooks';
import { ROLES } from '@/lib/constants';
import { WebsiteAddButton } from './WebsiteAddButton';
import { WebsitesDataTable } from './WebsitesDataTable';

export function WebsitesPage() {
  const { user } = useLoginQuery();
  const { teamId } = useNavigation();
  const { t, labels } = useMessages();
  const { data } = useTeamMembersQuery(teamId);

  const showActions =
    (teamId &&
      data?.data.filter(team => team.userId === user.id && team.role !== ROLES.teamViewOnly)
        .length > 0) ||
    (!teamId && user.role !== ROLES.viewOnly);

  return (
    <PageBody>
      <Column gap="6" margin="2">
        <PageHeader title={t(labels.websites)}>
          {showActions && <WebsiteAddButton teamId={teamId} />}
        </PageHeader>

        {/* SmallMetrics business KPI strip — placeholder */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
          }}
        >
          {[
            { label: 'Visitas totales' },
            { label: 'Tasa de conversión' },
            { label: 'Ingresos estimados' },
            { label: 'Nuevos usuarios' },
          ].map(kpi => (
            <div
              key={kpi.label}
              style={{
                backgroundColor: 'var(--surface-base)',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {kpi.label}
              </span>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                —
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>En desarrollo</span>
            </div>
          ))}
        </div>

        <Panel>
          <WebsitesDataTable teamId={teamId} showActions={showActions} />
        </Panel>
      </Column>
    </PageBody>
  );
}
