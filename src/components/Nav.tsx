import { NavLink, useLocation } from 'react-router'
import { NAV } from '../data/nav'
import { useAuth } from '../store/useAuth'
import { ROLE_LABELS } from '../data/rbac'
import { COMPANY_NAME } from '../data/garment'
import { Badge } from './ui'

export function Nav() {
  const { pathname, search } = useLocation()
  const here = pathname + search
  const permissions = useAuth((s) => s.rolePermissions[s.role])
  const modules = useAuth((s) => s.modules)
  const role = useAuth((s) => s.role)

  // Two filters, one list: the role must hold the permission, and the module
  // must have been switched on at setup. Unselected modules simply vanish.
  const groups = NAV.filter(
    (g) => permissions.includes(g.permission) && (!g.module || modules.includes(g.module)),
  )

  return (
    <nav
      aria-label="ناوبری اصلی"
      className="hidden h-full flex-col overflow-y-auto border-e border-line bg-surface md:flex"
    >
      <div className="border-b border-line px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-[8px] bg-brand text-[13px] font-bold text-white">
            Z
          </span>
          <span className="text-sm font-bold tracking-tight">زیمر</span>
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          {COMPANY_NAME} · {ROLE_LABELS[role]}
        </p>
      </div>

      <div className="flex-1 px-2.5 py-3">
        {groups.map((group) => {
          const Icon = group.icon
          const active = group.children.some((c) => here.startsWith(c.to.split('?')[0]) && c.to !== '/')
          const isRoot = group.children.some((c) => c.to === '/' && pathname === '/')
          return (
            <section key={group.label} className="mb-1.5">
              <div className="flex items-center gap-2 px-2.5 py-2">
                <Icon
                  size={16}
                  strokeWidth={1.5}
                  className={active || isRoot ? 'text-brand' : 'text-ink-soft'}
                />
                <span className="text-[13px] font-semibold">{group.label}</span>
                {group.badge && <Badge tone="brand" dot={false}>{group.badge}</Badge>}
              </div>
              <ul className="ms-[7px] border-s border-line ps-2.5">
                {group.children.map((child) => (
                  <li key={child.to}>
                    <NavLink
                      to={child.to}
                      end={child.to === '/'}
                      className={({ isActive }) =>
                        `block rounded-[8px] px-2.5 py-1.5 text-[13px] transition-colors ${
                          isActive && here === child.to
                            ? 'bg-brand-tint font-medium text-brand-ink'
                            : 'text-ink-soft hover:bg-canvas hover:text-ink'
                        }`
                      }
                    >
                      {child.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </nav>
  )
}
