'use client'

// Mission Templates Picker — quick-start cards that pre-fill the goal input
const TEMPLATES = [
  { label: 'Lead Generation', goal: 'Find 50 qualified B2B leads in SaaS for outreach this week' },
  { label: 'Content Calendar', goal: 'Create a 30-day social media content calendar for a startup' },
  { label: 'Market Research', goal: 'Analyze top 5 competitors and summarize their pricing strategies' },
  { label: 'Code Review', goal: 'Review codebase for security vulnerabilities and performance issues' },
  { label: 'Sales Outreach', goal: 'Draft 10 personalized cold email sequences for fintech prospects' },
  { label: 'Investor Update', goal: 'Write a monthly investor update email with KPIs and milestones' },
]

interface Props {
  onSelect: (goal: string) => void
}

export default function MissionTemplatesPicker({ onSelect }: Props) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '1rem' }}>Quick Start Templates</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
        {TEMPLATES.map((t) => (
          <button
            key={t.label}
            onClick={() => onSelect(t.goal)}
            style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '10px',
              padding: '0.875rem 1rem',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#22d3ee')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#27272a')}
          >
            <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem', color: '#22d3ee' }}>{t.label}</p>
            <p style={{ fontSize: '0.75rem', color: '#71717a', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {t.goal}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
