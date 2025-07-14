function getColorFromId(id) {
  let hash = 0;
  const strId = id.toString();
  for (let i = 0; i < strId.length; i++) {
    hash = strId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = (hash % 360 + 360) % 360; // ensure positive hue
  return `hsl(${hue}, 70%, 50%)`;
}

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [255 * f(0), 255 * f(8), 255 * f(4)];
}

function getTextColorForBackground(hsl) {
  const match = hsl.match(/hsl\((.+), (.+)%, (.+)%\)/);
  if (!match) {
    console.error("Invalid HSL string:", hsl);
    return "white"; // fallback
  }
  const [, h, s, l] = match.map(Number);
  const [r, g, b] = hslToRgb(h, s, l);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "black" : "white";
}

export default function WorkerEntry({
  id,
  fullName,
  role,
  spu_id
}) {
  const initials = fullName.charAt(0).toUpperCase();

  let bgColor = getColorFromId(fullName);
  let textColor = getTextColorForBackground(bgColor);

  return (
    <a
      href={`/worker-profile`}
      // href={`/workers/${id}`}
      className="client-entry grid grid-cols-[2fr_1fr_2fr] items-center p-5 mb-2 bg-white rounded-lg font-bold-label"
    >
      <div className="flex items-center gap-6">
        <div
          className="rounded-full h-[4.5rem] w-[4.5rem] flex justify-center items-center header-sub"
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          {initials}
        </div>
        <div className="flex flex-col gap-2">
          <p>{fullName}</p>
          <p>{id}</p>
        </div>
      </div>
      <p className="text-center">{role === "sdw" ? "SDW" : role === "super" ? "Supervisor" : "Admin"}</p>
      <p className="text-center">{spu_id}</p>
    </a>
  );
}
