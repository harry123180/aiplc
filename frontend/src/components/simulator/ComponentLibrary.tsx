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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '5px 12px 5px 14px',
        cursor: 'grab',
        transition: 'background 150ms cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div
        className="lib-thumb"
        style={{
          width: 34,
          height: 34,
          flexShrink: 0,
          borderRadius: 'var(--qp-r-sm, 8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--qp-border, #e5e7eb)',
          background: item.color + '14',
        }}
      >
        <MiniSymbol symbol={item.symbol} color={item.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="lib-name"
          style={{
            fontSize: '12.5px',
            fontWeight: 500,
            color: 'var(--qp-text, #1a1a2e)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.name}
        </div>
        <div
          className="lib-pin"
          style={{
            fontSize: '10.5px',
            fontFamily: "var(--qp-font-mono, 'JetBrains Mono', monospace)",
            color: 'var(--qp-text-dim, #9ca3af)',
            marginTop: 1,
          }}
        >
          {item.pins} pin
        </div>
      </div>
      <button
        className="lib-add"
        onClick={(e) => {
          e.stopPropagation()
          onAdd()
        }}
        style={{
          opacity: 0,
          flexShrink: 0,
          display: 'flex',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: 2,
          borderRadius: 4,
          color: 'var(--qp-primary, #1a4fa0)',
          transition: 'opacity 150ms',
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
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({ ctrl: true, input: true, output: true })
  const [tab, setTab] = useState<'all' | 'fav'>('all')

  /* ── Collapsed rail ────────────────────────── */
  if (collapsed) {
    return (
      <div
        className="lib-rail"
        style={{
          width: 48,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          padding: '8px 0',
          borderRight: '1px solid var(--qp-border, #e5e7eb)',
          background: 'var(--qp-bg-alt, #f8fafc)',
        }}
      >
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
            style={{
              width: 36,
              height: 36,
              border: 'none',
              background: 'transparent',
              borderRadius: 'var(--qp-r-sm, 8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--qp-text-muted, #6b7280)',
              transition: 'all 150ms',
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
    <div
      className="lib-panel"
      style={{
        width: 224,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--qp-border, #e5e7eb)',
        background: 'var(--qp-bg-alt, #f8fafc)',
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div
        className="lib-head"
        style={{
          padding: '11px 12px 9px',
          borderBottom: '1px solid var(--qp-border, #e5e7eb)',
          background: 'var(--qp-bg, #fff)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
          <span
            className="qp-eyebrow"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--qp-primary-light, #2d6be4)',
            }}
          >
            元件庫 · {total}
          </span>
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
        <div
          className="lib-search"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '0 10px',
            height: 34,
            border: '1.5px solid var(--qp-border, #e5e7eb)',
            borderRadius: 'var(--qp-r-sm, 8px)',
            background: 'var(--qp-bg-alt, #f8fafc)',
          }}
        >
          <Search size={14} color="var(--qp-text-dim, #9ca3af)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋元件…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: "var(--qp-font-sans, 'Inter', sans-serif)",
              fontSize: 13,
              color: 'var(--qp-text, #1a1a2e)',
              minWidth: 0,
            }}
          />
          {q && (
            <button
              className="lib-clear"
              onClick={() => setQuery('')}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--qp-text-dim, #9ca3af)',
                display: 'flex',
                padding: 2,
                borderRadius: 4,
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="lib-tabs" style={{ display: 'flex', gap: 4, marginTop: 9 }}>
          <button
            className={tab === 'all' ? 'active' : ''}
            onClick={() => setTab('all')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flex: 1,
              justifyContent: 'center',
              height: 28,
              border: '1px solid var(--qp-border, #e5e7eb)',
              background: tab === 'all' ? 'var(--qp-bg-tint, #f0f5ff)' : 'var(--qp-bg, #fff)',
              borderRadius: 'var(--qp-r-sm, 8px)',
              cursor: 'pointer',
              fontFamily: "var(--qp-font-sans, 'Inter', sans-serif)",
              fontSize: 12,
              fontWeight: 600,
              color: tab === 'all' ? 'var(--qp-primary, #1a4fa0)' : 'var(--qp-text-muted, #6b7280)',
              borderColor: tab === 'all' ? '#bcd2f5' : 'var(--qp-border, #e5e7eb)',
            }}
          >
            全部
          </button>
          <button
            className={tab === 'fav' ? 'active' : ''}
            onClick={() => setTab('fav')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flex: 1,
              justifyContent: 'center',
              height: 28,
              border: '1px solid var(--qp-border, #e5e7eb)',
              background: tab === 'fav' ? 'var(--qp-bg-tint, #f0f5ff)' : 'var(--qp-bg, #fff)',
              borderRadius: 'var(--qp-r-sm, 8px)',
              cursor: 'pointer',
              fontFamily: "var(--qp-font-sans, 'Inter', sans-serif)",
              fontSize: 12,
              fontWeight: 600,
              color: tab === 'fav' ? 'var(--qp-primary, #1a4fa0)' : 'var(--qp-text-muted, #6b7280)',
              borderColor: tab === 'fav' ? '#bcd2f5' : 'var(--qp-border, #e5e7eb)',
            }}
          >
            <Lightbulb size={12} />常用
          </button>
        </div>
      </div>

      {/* Body — scrollable list */}
      <div
        className="lib-body code-scroll"
        style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '6px 0' }}
      >
        {filtered.length === 0 && (
          <div
            className="lib-empty"
            style={{ padding: '24px 16px', textAlign: 'center', fontSize: '12.5px', color: 'var(--qp-text-dim, #9ca3af)' }}
          >
            找不到「{q}」相關元件
          </div>
        )}
        {filtered.map((cat) => {
          const isOpen = q !== '' || openCats[cat.id]
          return (
            <div key={cat.id} className="lib-group" style={{ marginBottom: 2 }}>
              <button
                className="lib-group-head"
                onClick={() => setOpenCats((o) => ({ ...o, [cat.id]: !o[cat.id] }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  width: '100%',
                  padding: '7px 12px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: "var(--qp-font-sans, 'Inter', sans-serif)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: 'var(--qp-text-muted, #6b7280)',
                  textTransform: 'uppercase',
                }}
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
                <span
                  className="lib-count"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--qp-text-dim, #9ca3af)',
                    background: 'var(--qp-border, #e5e7eb)',
                    borderRadius: 100,
                    padding: '1px 7px',
                  }}
                >
                  {cat.list.length}
                </span>
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
      <div
        className="lib-foot"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: 8,
          borderTop: '1px solid var(--qp-border, #e5e7eb)',
          background: 'var(--qp-bg, #fff)',
          fontSize: 11,
          color: 'var(--qp-text-dim, #9ca3af)',
          flexShrink: 0,
        }}
      >
        <Plus size={12} color="var(--qp-text-dim, #9ca3af)" />
        點擊或拖曳至畫布放置
      </div>
    </div>
  )
}
