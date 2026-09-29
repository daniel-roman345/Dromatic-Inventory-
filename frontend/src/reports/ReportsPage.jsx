import { useState } from 'react'
import { downloadFile, errorMessage } from '../api/client'
import { useAppData } from '../app/AppDataContext'
import Icon from '../shared/Icon'
import { Field, useToast } from '../shared/ui'

/** Reportes para imprimir (PDF) o para trabajar en Excel (CSV). */
export default function ReportsPage() {
  const { modules } = useAppData()
  const toast = useToast()
  const [inv, setInv] = useState({ module: '', lowStock: false })
  const [mov, setMov] = useState({ module: '', effect: '', from: '', to: '' })
  const [busy, setBusy] = useState('')

  async function download(key, url, params, name) {
    setBusy(key)
    try {
      await downloadFile(url, params, name)
    } catch (e) {
      toast(errorMessage(e, 'No se pudo generar el reporte.'), 'error')
    } finally {
      setBusy('')
    }
  }

  const buttons = (key, url, params, name) => (
    <div className="row">
      <button className="btn btn-primary" disabled={!!busy} onClick={() => download(`${key}-pdf`, url, { ...params, format: 'pdf' }, `${name}.pdf`)}>
        <Icon name="report" /> {busy === `${key}-pdf` ? 'Generando…' : 'PDF para imprimir'}
      </button>
      <button className="btn" disabled={!!busy} onClick={() => download(`${key}-csv`, url, { ...params, format: 'csv' }, `${name}.csv`)}>
        <Icon name="download" /> {busy === `${key}-csv` ? 'Generando…' : 'Excel (CSV)'}
      </button>
    </div>
  )

  return (
    <div>
      <div className="page-header"><div><h1>Reportes</h1><p>Descárguelos para imprimir, enviar o revisar en Excel.</p></div></div>
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card stack">
          <div className="row"><span className="mod-icon"><Icon name="box" /></span><div><h2>Inventario</h2><div className="small muted">Cuánto hay de cada artículo y dónde está</div></div></div>
          <Field label="Módulo">
            <select value={inv.module} onChange={(e) => setInv({ ...inv, module: e.target.value })}>
              <option value="">Todos los módulos</option>
              {modules.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
            </select>
          </Field>
          <label className="check"><input type="checkbox" checked={inv.lowStock} onChange={(e) => setInv({ ...inv, lowStock: e.target.checked })} /> Solo los que están en stock bajo</label>
          {buttons('inv', '/reports/inventory', { module: inv.module || undefined, lowStock: inv.lowStock }, 'inventario')}
        </div>
        <div className="card stack">
          <div className="row"><span className="mod-icon"><Icon name="history" /></span><div><h2>Movimientos</h2><div className="small muted">Entradas, salidas, traslados y ajustes</div></div></div>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <Field label="Módulo">
              <select value={mov.module} onChange={(e) => setMov({ ...mov, module: e.target.value })}>
                <option value="">Todos</option>
                {modules.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Qué pasó">
              <select value={mov.effect} onChange={(e) => setMov({ ...mov, effect: e.target.value })}>
                <option value="">Todo</option><option value="ENTRADA">Entradas</option><option value="SALIDA">Salidas</option>
                <option value="TRASLADO">Traslados</option><option value="AJUSTE">Ajustes</option>
              </select>
            </Field>
            <Field label="Desde"><input type="date" value={mov.from} onChange={(e) => setMov({ ...mov, from: e.target.value })} /></Field>
            <Field label="Hasta"><input type="date" value={mov.to} onChange={(e) => setMov({ ...mov, to: e.target.value })} /></Field>
          </div>
          {buttons('mov', '/reports/movements', { module: mov.module || undefined, effect: mov.effect || undefined, from: mov.from || undefined, to: mov.to || undefined }, 'movimientos')}
        </div>
      </div>
    </div>
  )
}
