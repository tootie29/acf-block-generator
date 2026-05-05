// Inline SVGs share the same 18×18 viewBox, 1.75 stroke, currentColor — keeps
// every icon visually consistent regardless of OS font rendering.
function IconSliders() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="6" x2="14" y2="6" />
      <circle cx="17" cy="6" r="2" />
      <line x1="4" y1="12" x2="9" y2="12" />
      <circle cx="12" cy="12" r="2" />
      <line x1="15" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="16" y2="18" />
      <circle cx="19" cy="18" r="2" />
    </svg>
  )
}

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function IconChevron({ direction = 'right' }) {
  // Same chevron, rotated for the inverse state.
  const transform = direction === 'left' ? 'rotate(180 12 12)' : undefined
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 6 15 12 9 18" transform={transform} />
    </svg>
  )
}

const MENU = [
  {
    id: 'generator',
    label: 'Generator',
    hint: 'Build a custom block',
    Icon: IconSliders,
  },
  {
    id: 'templates',
    label: 'Templates',
    hint: 'Ready-to-download presets',
    Icon: IconGrid,
  },
]

export default function Sidebar({ view, onChange, collapsed = false, onToggle }) {
  return (
    <nav
      className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}
      aria-label="Primary"
    >
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark">ACF</span>
        {!collapsed && <span className="sidebar__brand-name">Block Generator</span>}
      </div>

      <ul className="sidebar__menu">
        {MENU.map(({ id, label, hint, Icon }) => (
          <li key={id}>
            <button
              type="button"
              className={`sidebar__menu-item ${view === id ? 'is-active' : ''}`}
              onClick={() => onChange(id)}
              aria-current={view === id ? 'page' : undefined}
              title={collapsed ? `${label} — ${hint}` : undefined}
            >
              <span className="sidebar__menu-icon">
                <Icon />
              </span>
              {!collapsed && (
                <span className="sidebar__menu-label">
                  <span className="sidebar__menu-label-primary">{label}</span>
                  <span className="sidebar__menu-label-hint">{hint}</span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <div className="sidebar__footer">
        <button
          type="button"
          className="sidebar__toggle"
          onClick={onToggle}
          aria-pressed={!collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="sidebar__toggle-icon">
            <IconChevron direction={collapsed ? 'right' : 'left'} />
          </span>
          {!collapsed && <span className="sidebar__toggle-label">Collapse</span>}
        </button>
        {!collapsed && (
          <span className="sidebar__footer-label">RichardMedina agency</span>
        )}
      </div>
    </nav>
  )
}
