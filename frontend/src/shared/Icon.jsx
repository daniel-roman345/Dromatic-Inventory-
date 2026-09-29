/**
 * Íconos de línea (24×24) dibujados en SVG, sin librerías externas.
 * Uso: <Icon name="map" />
 */
const PATHS = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></>,
  bottle: <><path d="M9 2h6v3l1.5 2.5V21a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V7.5L9 5z" /><path d="M7.5 11h9" /><path d="M7.5 16h9" /></>,
  circle: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /></>,
  tag: <><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  flask: <><path d="M9 3h6" /><path d="M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3" /><path d="M7 15h10" /></>,
  cylinder: <><ellipse cx="12" cy="5.5" rx="7" ry="2.5" /><path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13" /><ellipse cx="12" cy="12" rx="2" ry="1" /></>,
  box: <><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" /><path d="M3 7.5 12 12l9-4.5" /><path d="M12 12v9" /></>,
  map: <><path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z" /><path d="M9 4v13.5" /><path d="M15 6.5V20" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  pin: <><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  entry: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M4 17v3h16v-3" /></>,
  exit: <><path d="M12 15V3" /><path d="m7 8 5-5 5 5" /><path d="M4 17v3h16v-3" /></>,
  swap: <><path d="M4 8h13" /><path d="m13 4 4 4-4 4" /><path d="M20 16H7" /><path d="m11 12-4 4 4 4" /></>,
  adjust: <><path d="M4 6h10" /><path d="M18 6h2" /><circle cx="16" cy="6" r="2" /><path d="M4 12h3" /><path d="M11 12h9" /><circle cx="9" cy="12" r="2" /><path d="M4 18h12" /><circle cx="18" cy="18" r="2" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></>,
  bell: <><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  report: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5" /><path d="M9 13h7" /><path d="M9 17h5" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14.8c1.9.7 3.1 2.5 3.5 5.2" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  list: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></>,
  logout: <><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4" /><path d="M6 12h10" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  minus: <><path d="M5 12h14" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></>,
  check: <><path d="m5 12.5 4.5 4.5L19 7" /></>,
  close: <><path d="M6 6l12 12M18 6 6 18" /></>,
  chevronRight: <><path d="m9 6 6 6-6 6" /></>,
  chevronLeft: <><path d="m15 6-6 6 6 6" /></>,
  chevronDown: <><path d="m6 9 6 6 6-6" /></>,
  alert: <><path d="M12 3 2 20h20z" /><path d="M12 10v4" /><path d="M12 17.2v.1" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.8v.1" /></>,
  ok: <><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.7 2.7L16 10" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></>,
  whatsapp: <><path d="M4 20l1.2-4A8 8 0 1 1 8 18.8z" /><path d="M9 9.2c0 3 2.8 5.8 5.8 5.8l1.2-1.4-1.9-1-1 .9c-1-.4-2.2-1.6-2.6-2.6l.9-1-1-1.9z" /></>,
  zoomIn: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /><path d="M11 8v6M8 11h6" /></>,
  zoomOut: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /><path d="M8 11h6" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="9.5" r="1.8" /><path d="m21 16-5-5-9 9" /></>,
  upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 16v4h16v-4" /></>,
  download: <><path d="M12 4v12" /><path d="m7 11 5 5 5-5" /><path d="M4 20h16" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  unlock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.5-2" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9" /><path d="m17 6 3 3" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></>,
  sparkles: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></>,
  stairs: <><path d="M3 20h5v-4h4v-4h4V8h5" /><path d="M3 20V16" /></>,
  desk: <><path d="M3 9h18" /><path d="M5 9v11M19 9v11" /><path d="M13 9v6h6" /><path d="M8 5h4v4H8z" /></>,
  door: <><path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17" /><path d="M3 21h18" /><circle cx="15" cy="12" r="1" /></>,
  fan: <><circle cx="12" cy="12" r="2" /><path d="M12 10c0-4 1-7 4-7 2 0 2 3 0 5l-2 2" /><path d="M14 12c4 0 7 1 7 4 0 2-3 2-5 0l-2-2" /><path d="M12 14c0 4-1 7-4 7-2 0-2-3 0-5l2-2" /><path d="M10 12c-4 0-7-1-7-4 0-2 3-2 5 0l2 2" /></>,
  hoist: <><path d="M4 3h16" /><path d="M12 3v8" /><path d="M9 11h6l-1 4h-4z" /><path d="M7 21l5-6 5 6" /></>,
  wall: <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="M3 12h18M9 5v7M15 12v7" /></>,
  rotulo: <><rect x="3" y="4" width="18" height="16" rx="1.5" /><path d="M3 9h18" /><path d="M7 13h10M7 16h6" /><path d="m16.5 5.5 1.5 1.5-1.5 1.5L15 7z" /></>,
}

export default function Icon({ name, size, className = '', title }) {
  const content = PATHS[name] || PATHS.info
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {content}
    </svg>
  )
}
