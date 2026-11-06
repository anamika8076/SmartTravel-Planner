// Photos (Unsplash, hot-linked as Unsplash's guidelines require) and colour
// fallbacks, picked deterministically so a place always gets the same look.

const u = (id) => `https://images.unsplash.com/photo-${id}`;

export const PHOTOS = {
  plane: u('1436491865332-7a61a109cc05'),
  mapFlatlay: u('1488646953014-85cb44e25828'),
  roadTrip: u('1469854523086-cc02fe5d8800'),
  snowTrek: u('1626621341517-bbf3d9990a23'),
  himalaya: u('1605649487212-47bdab064df7'),
  stupaPeaks: u('1544735716-392fe2489ffa'),
  pineValley: u('1464822759023-fed622ff2c3b'),
  cloudPeaks: u('1506905925346-21bda4d32df4'),
  greenHills: u('1470071459604-3b5ec3a7fe05'),
  lakeBoat: u('1501785888041-af3ef285b470'),
  lakeBow: u('1476514525535-07fb3b4ae5f1'),
  goaBeach: u('1512343879784-a960bf40e7f2'),
  sunsetBeach: u('1507525428034-b723cf961d3e'),
  islandVillas: u('1514282401047-d79a71a590e8'),
  hawaMahal: u('1477587458883-47145ed94245'),
  amberFort: u('1599661046289-e31897846e41'),
  tajMahal: u('1524492412937-b28074a5d7da'),
  indiaGate: u('1587474260584-136574528ed5'),
  gatewayOfIndia: u('1570168007204-dfb528c6958f'),
  mumbaiCst: u('1566552881560-0be862a7c445'),
};

// Keyword → photo. Checked against the destination name first, then its
// state/description, so "Kasol, Himachal Pradesh" still gets mountains.
const RULES = [
  [['manali', 'solang', 'kullu', 'kasol', 'shimla', 'himachal', 'spiti', 'dharamshala', 'mcleod'], PHOTOS.snowTrek],
  [['leh', 'ladakh', 'kashmir', 'gulmarg', 'srinagar', 'sikkim', 'gangtok', 'darjeeling', 'nepal'], PHOTOS.stupaPeaks],
  [['rishikesh', 'uttarakhand', 'nainital', 'mussoorie', 'auli', 'kedarnath', 'dehradun'], PHOTOS.himalaya],
  [['goa', 'gokarna', 'varkala', 'pondicherry', 'puducherry'], PHOTOS.goaBeach],
  [['andaman', 'lakshadweep', 'maldives', 'island'], PHOTOS.islandVillas],
  [['jaipur', 'pink city'], PHOTOS.hawaMahal],
  [['rajasthan', 'udaipur', 'jodhpur', 'jaisalmer', 'amber', 'fort'], PHOTOS.amberFort],
  [['agra', 'taj'], PHOTOS.tajMahal],
  [['delhi'], PHOTOS.indiaGate],
  [['mumbai', 'bombay'], PHOTOS.gatewayOfIndia],
  [['kerala', 'munnar', 'ooty', 'coorg', 'kodaikanal', 'wayanad'], PHOTOS.greenHills],
  [['lake', 'udaipur', 'srinagar'], PHOTOS.lakeBoat],
  [['beach', 'coast', 'sea'], PHOTOS.sunsetBeach],
  [['hill', 'mountain', 'valley', 'peak', 'trek', 'snow'], PHOTOS.pineValley],
];

const FALLBACKS = [PHOTOS.cloudPeaks, PHOTOS.lakeBow, PHOTOS.pineValley, PHOTOS.greenHills, PHOTOS.lakeBoat, PHOTOS.sunsetBeach];

function hash(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

function matchRule(text) {
  const t = text.toLowerCase();
  for (const [words, photo] of RULES) {
    if (words.some((w) => t.includes(w))) return photo;
  }
  return null;
}

/** Base photo URL for a place. `extra` can hold state/description for better matching. */
export function photoFor(name, extra = '') {
  return (
    matchRule(String(name || '')) ||
    matchRule(String(extra || '')) ||
    FALLBACKS[hash(String(name || '').toLowerCase()) % FALLBACKS.length]
  );
}

/** Sized Unsplash URL. */
export function sized(url, width, height) {
  const params = new URLSearchParams({ auto: 'format', fit: 'crop', w: String(width), q: '75' });
  if (height) params.set('h', String(height));
  return `${url}?${params}`;
}

// Shown behind photos while they load, or if they fail to load.
const GRADIENTS = [
  'from-sky-500 via-indigo-600 to-slate-900',
  'from-orange-400 via-rose-500 to-slate-900',
  'from-teal-500 via-sky-700 to-slate-900',
  'from-amber-400 via-orange-500 to-rose-700',
  'from-emerald-500 via-teal-700 to-slate-900',
];

export function gradientFor(name) {
  return GRADIENTS[hash(String(name || '').toLowerCase()) % GRADIENTS.length];
}
