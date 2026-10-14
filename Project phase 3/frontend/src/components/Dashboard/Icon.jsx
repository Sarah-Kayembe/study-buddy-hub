// Small line icons drawn for the Focus Den, so the dashboard doesn't load
// images from outside icon sites. They inherit the text color.

const PATHS = {
  // Focus: a target.
  focus: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </>
  ),
  // Break: a mug with steam.
  break: (
    <>
      <path d="M5 10h11v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5z" />
      <path d="M16 12h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M9 3.5c-.8 1 .8 2 0 3M12.5 3.5c-.8 1 .8 2 0 3" />
    </>
  ),
  // Chill: a crescent moon.
  chill: <path d="M19 14.5A8 8 0 0 1 9.5 5a8 8 0 1 0 9.5 9.5z" />,
  // Mood: a smiling face.
  mood: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14.5c1 1.5 2.4 2.2 4 2.2s3-.7 4-2.2" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
    </>
  ),
  // Sound: a speaker with waves.
  sound: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  // Show or hide the interface: an eye.
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  // Settings: sliders.
  settings: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  // Streak: a flame.
  flame: (
    <path d="M12 21c-4 0-6.5-2.6-6.5-6 0-3.5 2.6-5.6 3.6-8.5.4 1.8 1.5 3 2.6 3.5.3-2.6 1.6-5 3.8-6.5-.4 2.6.5 4.4 1.7 6.1 1 1.4 1.8 3 1.8 5.1 0 3.6-2.8 6.3-7 6.3z" />
  ),
  // Coins: a coin seen from the front.
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M14.5 9.5c-.5-.8-1.4-1.2-2.5-1.2-1.5 0-2.5.8-2.5 1.9 0 2.6 5 1.4 5 4 0 1.1-1 1.9-2.5 1.9-1.1 0-2-.4-2.5-1.2" />
    </>
  ),
  // Back to the main site.
  back: <path d="M14.5 5.5L8 12l6.5 6.5" />,
  // Profile: head and shoulders.
  user: (
    <>
      <circle cx="12" cy="8.5" r="4" />
      <path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6" />
    </>
  ),
};

export default function Icon({ name, size = 22, title, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ color: "#ffffff", flexShrink: 0, ...style }}
    >
      {PATHS[name]}
    </svg>
  );
}
