/* ──────────────────────────────────────────────────────────
   ComponentLibrary — dockable side-panel (224px expanded, 48px rail).
   Lists all CATALOG categories with search, filter tabs, and
   collapsible groups.  Ported from mock-circuit.jsx.
   ────────────────────────────────────────────────────────── */

import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Plus,
  Cpu,
  MousePointerClick,
  Lightbulb,
  Shield,
  RefreshCw,
  Zap,
  Monitor,
  MoreHorizontal,
} from 'lucide-react'
import { CATALOG } from './ComponentCatalog'
import type { CatalogCategory, CatalogItem } from './ComponentCatalog'
import MiniSymbol from './MiniSymbol'

/* ── Lucide icon map (matches CAT_ICON keys) ────────────── */
const CAT_LUCIDE: Record<string, React.ReactNode> = {
  ctrl:    <Cpu size={14} color="var(--qp-primary-light, #2d6be4)" />,
  input:   <MousePointerClick size={14} color="var(--qp-primary-light, #2d6be4)" />,
  output:  <Lightbulb size={14} color="var(--qp-primary-light, #2d6be4)" />,
  safe:    <Shield size={14} color="var(--qp-primary-light, #2d6be4)" />,
  sensor:  <Search size={14} color="var(--qp-primary-light, #2d6be4)" />,
  load:    <RefreshCw size={14} color="var(--qp-primary-light, #2d6be4)" />,
  power:   <Zap size={14} color="var(--qp-primary-light, #2d6be4)" />,
  comm:    <Monitor size={14} color="var(--qp-primary-light, #2d6be4)" />,
  passive: <MoreHorizontal size={14} color="var(--qp-primary-light, #2d6be4)" />,
}

const CAT_RAIL_LUCIDE: Record<string, React.ReactNode> = {
  ctrl:    <Cpu size={17} />,
  input:   <MousePointerClick size={17} />,
  output:  <Lightbulb size={17} />,
  safe:    <Shield size={17} />,
  sensor:  <Search size={17} />,
  load:    <RefreshCw size={17} />,
  power:   <Zap size={17} />,
  comm:    <Monitor size={17} />,
  passive: <MoreHorizontal size={17} />,
}

/* ── Props ─────────────────────────────────────────────── */
interface ComponentLibraryProps {
  collapsed: boolean
  onToggle: () => void
  onAddComponent: (type: string) => void
}

/* ── Single item row ───────────────────────────────────── */
function LibItem({ item, onAdd }: { item: CatalogItem; onAdd: () => void }) {
  return (
    <div
      className="lib-item"
      title={`${item.name} · ${item.pins} pin\n點擊放置或拖曳至畫布`}
    >
      <div className="lib-thumb" style={{ background: item.color + '14' }}>
        <MiniSymbol symbol={item.symbol} color={item.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="lib-name">{item.name}</div>
        <div className="lib-pin">{item.pins} pin</div>
      </div>
      <button
        className="lib-add"
        onClick={(e) => {
          e.stopPropagation()
          onAdd()
        }}
        title="加入畫布"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

/* ── Main component ────────────────────────────────────── */
export default function ComponentLibrary({ collapsed, onToggle, onAddComponent }: ComponentLibraryProps) {
  const [query, setQuery] = useState('')
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(
    Object.fromEntries(CATALOG.map(cat => [cat.id, true]))
  )
  const [tab, setTab] = useState<'all' | 'fav'>('all')

  /* ── Collapsed rail ────────────────────────── */
  if (collapsed) {
    return (
      <div className="lib-rail">
        <button
          className="qp-icon-btn"
          style={{ width: 32, height: 32, marginBottom: 6 }}
          onClick={onToggle}
          title="展開元件庫"
        >
          <ChevronRight size={16} />
        </button>
        {CATALOG.map((cat) => (
          <button
            key={cat.id}
            className="lib-rail-btn"
            title={cat.name}
            onClick={() => {
              onToggle()
              setOpenCats((o) => ({ ...o, [cat.id]: true }))
            }}
          >
            {CAT_RAIL_LUCIDE[cat.id] ?? <MoreHorizontal size={17} />}
          </button>
        ))}
      </div>
    )
  }

  /* ── Filtering ─────────────────────────────── */
  const q = query.trim()
  const filtered: Array<CatalogCategory & { list: CatalogItem[] }> = CATALOG.map((cat) => ({
    ...cat,
    list: cat.items.filter(
      (it) =>
        (tab === 'fav' ? it.favorite : true) &&
        (q === '' || it.name.includes(q) || cat.name.includes(q)),
    ),
  })).filter((cat) => cat.list.length > 0)

  const total = CATALOG.reduce((s, c) => s + c.items.length, 0)

  /* ── Expanded panel ────────────────────────── */
  return (
    <div className="lib-panel">
      {/* Header */}
      <div className="lib-head">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
          <span className="qp-eyebrow">元件庫 · {total}</span>
          <button
            className="qp-icon-btn"
            style={{ width: 26, height: 26, border: 'none' }}
            onClick={onToggle}
            title="收合元件庫"
          >
            <ChevronLeft size={15} />
          </button>
        </div>

        {/* Search */}
        <div className="lib-search">
          <Search size={14} color="var(--qp-text-dim, #9ca3af)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋元件…"
          />
          {q && (
            <button className="lib-clear" onClick={() => setQuery('')}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="lib-tabs">
          <button
            className={tab === 'all' ? 'active' : ''}
            onClick={() => setTab('all')}
          >
            全部
          </button>
          <button
            className={tab === 'fav' ? 'active' : ''}
            onClick={() => setTab('fav')}
          >
            <Lightbulb size={12} />常用
          </button>
        </div>
      </div>

      {/* Body — scrollable list */}
      <div className="lib-body code-scroll">
        {filtered.length === 0 && (
          <div className="lib-empty">
            找不到「{q}」相關元件
          </div>
        )}
        {filtered.map((cat) => {
          const isOpen = q !== '' || openCats[cat.id]
          return (
            <div key={cat.id} className="lib-group">
              <button
                className="lib-group-head"
                onClick={() => setOpenCats((o) => ({ ...o, [cat.id]: !o[cat.id] }))}
              >
                <ChevronDown
                  size={13}
                  color="var(--qp-text-dim, #9ca3af)"
                  style={{
                    transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 150ms',
                  }}
                />
                {CAT_LUCIDE[cat.id] ?? <MoreHorizontal size={14} />}
                <span style={{ flex: 1, textAlign: 'left' }}>{cat.name}</span>
                <span className="lib-count">{cat.list.length}</span>
              </button>
              {isOpen && (
                <div>
                  {cat.list.map((it, i) => (
                    <LibItem key={i} item={it} onAdd={() => onAddComponent(it.type)} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="lib-foot">
        <Plus size={12} color="var(--qp-text-dim, #9ca3af)" />
        點擊或拖曳至畫布放置
      </div>
    </div>
  )
}
