import { useEffect, useRef, useState } from 'react'
import { itemsApi } from '../api/services'
import { errorMessage } from '../api/client'
import Icon from '../shared/Icon'
import ImageZoom from '../shared/ImageZoom'
import { useToast } from '../shared/ui'

/** Imágenes delantera y trasera del artículo, con zoom y opción de cambiarlas. */
export default function ItemImages({ item, canEdit, onChanged }) {
  return (
    <div className="grid-2">
      <ImageSlot item={item} side="FRONT" title="Delantera" has={item.hasFrontImage} source={item.frontImageSource} canEdit={canEdit} onChanged={onChanged} />
      <ImageSlot item={item} side="BACK" title="Trasera" has={item.hasBackImage} source={item.backImageSource} canEdit={canEdit} onChanged={onChanged} />
    </div>
  )
}

function ImageSlot({ item, side, title, has, source, canEdit, onChanged }) {
  const toast = useToast()
  const [url, setUrl] = useState(null)
  const [zoom, setZoom] = useState(false)
  const [busy, setBusy] = useState(false)
  const input = useRef(null)

  useEffect(() => {
    let objectUrl
    let alive = true
    setUrl(null)
    if (has) {
      itemsApi.imageBlob(item.id, side).then((blob) => {
        if (!alive) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      }).catch(() => {})
    }
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [item.id, side, has, item.updatedAt])

  async function upload(file) {
    if (!file) return
    setBusy(true)
    try {
      const updated = await itemsApi.uploadImage(item.id, side, file)
      toast(`Imagen ${title.toLowerCase()} guardada`)
      onChanged(updated)
    } catch (e) {
      toast(errorMessage(e), 'error')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  async function remove() {
    if (!window.confirm(`¿Quitar la imagen ${title.toLowerCase()}?`)) return
    try {
      onChanged(await itemsApi.removeImage(item.id, side))
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  return (
    <div className="stack-sm">
      <div className="image-slot">
        <span className="tag badge badge-gray">{title}{source === 'VIDEO' ? ' · del video' : ''}</span>
        {url ? <img src={url} alt={`${title} de ${item.name}`} onClick={() => setZoom(true)} />
          : <div className="center muted small"><Icon name="image" size={34} /><div>{has ? 'Cargando…' : 'Sin imagen'}</div></div>}
      </div>
      {canEdit && (
        <div className="row" style={{ gap: 6 }}>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => upload(e.target.files?.[0])} />
          <button className="btn btn-sm" onClick={() => input.current?.click()} disabled={busy}><Icon name="upload" /> {has ? 'Cambiar' : 'Subir foto'}</button>
          {has && <button className="btn btn-sm btn-ghost" onClick={remove}><Icon name="trash" /></button>}
          {url && <button className="btn btn-sm btn-ghost" onClick={() => setZoom(true)}><Icon name="zoomIn" /> Ver grande</button>}
        </div>
      )}
      {zoom && url && <ImageZoom src={url} title={`${item.name} · ${title}`} onClose={() => setZoom(false)} />}
    </div>
  )
}
