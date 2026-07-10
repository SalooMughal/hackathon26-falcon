import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  getAllPlatformSettings,
  updatePlatformSettings,
} from '../../api/platformSettings'
import type { PlatformSetting } from '../../api/types'
import { usePermissions } from '../../lib/permissions'
import '../../styles/dashboard.css'

const SECRET_KEYS = /api_key|secret|password|access_key/i

function groupKey(settingKey: string) {
  const i = settingKey.indexOf('.')
  return i === -1 ? 'general' : settingKey.slice(0, i)
}

function isSecret(key: string) {
  return SECRET_KEYS.test(key)
}

export default function PlatformSettingsPage() {
  const { can } = usePermissions()
  const canUpdate = can('platform-settings', 'update')

  const [settings, setSettings] = useState<PlatformSetting[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [filter, setFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await getAllPlatformSettings()
    setLoading(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setSettings(result.data.settings)
    const next: Record<string, string> = {}
    for (const s of result.data.settings) {
      next[s.settingKey] = s.settingValue
    }
    setDrafts(next)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const dirty = useMemo(() => {
    return settings.filter((s) => drafts[s.settingKey] !== s.settingValue)
  }, [settings, drafts])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return settings
    return settings.filter(
      (s) =>
        s.settingKey.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q),
    )
  }, [settings, filter])

  const groups = useMemo(() => {
    const map = new Map<string, PlatformSetting[]>()
    for (const s of filtered) {
      const g = groupKey(s.settingKey)
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(s)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!canUpdate || dirty.length === 0) return

    setSaving(true)
    setError('')
    setInfo('')

    const result = await updatePlatformSettings(
      dirty.map((s) => ({
        key: s.settingKey,
        value: drafts[s.settingKey] ?? '',
      })),
    )

    setSaving(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    const { summary } = result.data
    setInfo(
      summary.failed > 0
        ? `${summary.successful} updated, ${summary.failed} failed.`
        : `${summary.successful} setting(s) saved.`,
    )
    await load()
  }

  function renderInput(setting: PlatformSetting) {
    const value = drafts[setting.settingKey] ?? ''
    const secret = isSecret(setting.settingKey)
    const show = revealed[setting.settingKey]

    if (setting.settingType === 'boolean') {
      return (
        <select
          value={value === 'true' ? 'true' : 'false'}
          onChange={(e) =>
            setDrafts((d) => ({ ...d, [setting.settingKey]: e.target.value }))
          }
          disabled={!canUpdate}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      )
    }

    if (setting.settingType === 'number') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) =>
            setDrafts((d) => ({ ...d, [setting.settingKey]: e.target.value }))
          }
          disabled={!canUpdate}
        />
      )
    }

    if (secret) {
      return (
        <div className="dash-secret-row">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) =>
              setDrafts((d) => ({ ...d, [setting.settingKey]: e.target.value }))
            }
            disabled={!canUpdate}
            autoComplete="off"
          />
          <button
            type="button"
            className="dash-btn dash-btn--ghost dash-btn--sm"
            onClick={() =>
              setRevealed((r) => ({
                ...r,
                [setting.settingKey]: !r[setting.settingKey],
              }))
            }
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
      )
    }

    if (setting.settingType === 'json' || value.length > 80) {
      return (
        <textarea
          value={value}
          onChange={(e) =>
            setDrafts((d) => ({ ...d, [setting.settingKey]: e.target.value }))
          }
          disabled={!canUpdate}
          rows={3}
        />
      )
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) =>
          setDrafts((d) => ({ ...d, [setting.settingKey]: e.target.value }))
        }
        disabled={!canUpdate}
      />
    )
  }

  return (
    <section className="dash-page">
      <header className="dash-header">
        <div>
          <h1>Platform settings</h1>
          <p>Configure AI providers, RAG thresholds, email, and other runtime keys.</p>
        </div>
        {canUpdate ? (
          <div className="dash-actions">
            <button
              type="button"
              className="dash-btn"
              disabled={saving || dirty.length === 0}
              onClick={() => void handleSave({ preventDefault() {} } as FormEvent)}
            >
              {saving
                ? 'Saving…'
                : dirty.length
                  ? `Save ${dirty.length} change${dirty.length === 1 ? '' : 's'}`
                  : 'No changes'}
            </button>
          </div>
        ) : null}
      </header>

      {error ? (
        <p className="dash-alert dash-alert--error" role="alert">
          {error}
        </p>
      ) : null}
      {info ? <p className="dash-alert dash-alert--info">{info}</p> : null}

      <div className="dash-toolbar">
        <label className="dash-field dash-field--inline">
          <span className="sr-only">Filter settings</span>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by key or description…"
          />
        </label>
      </div>

      {loading ? (
        <div className="dash-panel">
          <p className="dash-muted">Loading settings…</p>
        </div>
      ) : (
        <form className="settings-groups" onSubmit={handleSave}>
          {groups.map(([group, items]) => (
            <div key={group} className="dash-panel settings-group">
              <h2 className="settings-group-title">{group}</h2>
              <div className="settings-list">
                {items.map((setting) => {
                  const changed = drafts[setting.settingKey] !== setting.settingValue
                  return (
                    <label key={setting.id} className="dash-field settings-row">
                      <span className="settings-key">
                        {setting.settingKey}
                        {changed ? <em className="settings-dirty"> · edited</em> : null}
                      </span>
                      {setting.description ? (
                        <span className="settings-desc">{setting.description}</span>
                      ) : null}
                      {renderInput(setting)}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}

          {groups.length === 0 ? (
            <div className="dash-panel">
              <p className="dash-muted">No settings match your filter.</p>
            </div>
          ) : null}

          {canUpdate && dirty.length > 0 ? (
            <div className="dash-actions">
              <button type="submit" className="dash-btn" disabled={saving}>
                {saving ? 'Saving…' : `Save ${dirty.length} change${dirty.length === 1 ? '' : 's'}`}
              </button>
            </div>
          ) : null}
        </form>
      )}
    </section>
  )
}
