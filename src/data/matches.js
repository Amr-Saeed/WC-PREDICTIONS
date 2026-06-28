export const FLAGS = {
  Germany: "🇩🇪",
  Paraguay: "🇵🇾",
  France: "🇫🇷",
  Sweden: "🇸🇪",
  "South Africa": "🇿🇦",
  Canada: "🇨🇦",
  Netherlands: "🇳🇱",
  Morocco: "🇲🇦",
  Portugal: "🇵🇹",
  Croatia: "🇭🇷",
  Spain: "🇪🇸",
  Austria: "🇦🇹",
  "United States": "🇺🇸",
  "Bosnia-Herzegovina": "🇧🇦",
  Belgium: "🇧🇪",
  Senegal: "🇸🇳",
  Brazil: "🇧🇷",
  Japan: "🇯🇵",
  "Ivory Coast": "🇨🇮",
  Norway: "🇳🇴",
  Mexico: "🇲🇽",
  Ecuador: "🇪🇨",
  England: "🏴",
  "DR Congo": "🇨🇩",
  Argentina: "🇦🇷",
  "Cape Verde": "🇨🇻",
  Australia: "🇦🇺",
  Egypt: "🇪🇬",
  Switzerland: "🇨🇭",
  Algeria: "🇩🇿",
  Colombia: "🇨🇴",
  Ghana: "🇬🇭",
};

export function flag(team) {
  return FLAGS[team] || "🏳️";
}

export const MATCHES = [
  { id: "m1", group: "Left Bracket", home: "Germany", away: "Paraguay" },
  { id: "m2", group: "Left Bracket", home: "France", away: "Sweden" },
  { id: "m3", group: "Left Bracket", home: "South Africa", away: "Canada" },
  { id: "m4", group: "Left Bracket", home: "Netherlands", away: "Morocco" },
  { id: "m5", group: "Left Bracket", home: "Portugal", away: "Croatia" },
  { id: "m6", group: "Left Bracket", home: "Spain", away: "Austria" },
  { id: "m7", group: "Left Bracket", home: "United States", away: "Bosnia-Herzegovina" },
  { id: "m8", group: "Left Bracket", home: "Belgium", away: "Senegal" },
  { id: "m9", group: "Right Bracket", home: "Brazil", away: "Japan" },
  { id: "m10", group: "Right Bracket", home: "Ivory Coast", away: "Norway" },
  { id: "m11", group: "Right Bracket", home: "Mexico", away: "Ecuador" },
  { id: "m12", group: "Right Bracket", home: "England", away: "DR Congo" },
  { id: "m13", group: "Right Bracket", home: "Argentina", away: "Cape Verde" },
  { id: "m14", group: "Right Bracket", home: "Australia", away: "Egypt" },
  { id: "m15", group: "Right Bracket", home: "Switzerland", away: "Algeria" },
  { id: "m16", group: "Right Bracket", home: "Colombia", away: "Ghana" },
];

export const METHODS = [
  { key: "regular", label: "Regular Time", pts: "+1 pt" },
  { key: "extra_time", label: "Extra Time", pts: "+1 bonus" },
  { key: "penalties", label: "Penalties", pts: "+2 bonus" },
];

export function methodLabel(key) {
  const m = METHODS.find((x) => x.key === key);
  return m ? m.label : key;
}
