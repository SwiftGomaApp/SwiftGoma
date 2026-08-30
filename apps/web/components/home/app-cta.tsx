import type { Locale } from "@/lib/language";

const STRINGS = {
  en: {
    eyebrow: "Coming soon",
    title: "Take Swiftgoma with you.",
    description:
      "Our mobile app is on its way — order from local shops, track deliveries, and manage your account on the go.",
    appStoreEyebrow: "Download on the",
    appStoreName: "App Store",
    playStoreEyebrow: "Get it on",
    playStoreName: "Google Play",
  },
  fr: {
    eyebrow: "Bientôt disponible",
    title: "Emportez Swiftgoma partout avec vous.",
    description:
      "Notre application mobile arrive bientôt — commandez auprès des boutiques locales, suivez vos livraisons et gérez votre compte où que vous soyez.",
    appStoreEyebrow: "Télécharger sur",
    appStoreName: "App Store",
    playStoreEyebrow: "Disponible sur",
    playStoreName: "Google Play",
  },
} as const;

const AppleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M16.365 1.43c0 1.14-.415 2.06-1.246 2.76-.859.72-1.879 1.14-2.86 1.06a3.1 3.1 0 0 1-.03-.4c0-1.1.478-2.14 1.28-2.86.83-.76 2.03-1.13 2.83-1.19.02.21.026.42.026.63Zm4.106 15.36c-.53 1.22-.79 1.77-1.47 2.85-.95 1.5-2.29 3.37-3.95 3.39-1.48.02-1.86-.97-3.87-.96-2.01.01-2.43.98-3.9.96-1.66-.02-2.93-1.71-3.88-3.21-2.66-4.2-2.94-9.13-1.3-11.75 1.16-1.86 2.99-2.95 4.71-2.95 1.75 0 2.85 1 4.3 1 1.4 0 2.26-1 4.3-1 1.53 0 3.16.83 4.32 2.27-3.8 2.08-3.18 7.5.72 9.15Z" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      d="M4.4 2.6c-.4.3-.6.8-.6 1.4v16c0 .6.2 1.1.6 1.4l.1.1L13.6 12v-.2L4.5 2.5l-.1.1Z"
      fill="#00D6FF"
    />
    <path
      d="m16.6 15 -3-3v-.2l3-3 .1.1 3.6 2c1 .6 1 1.5 0 2.1l-3.6 2Z"
      fill="#FFCF00"
    />
    <path
      d="M16.6 15 13.6 12 4.4 21.4c.35.36.93.4 1.58.05L16.6 15Z"
      fill="#FF3363"
    />
    <path
      d="M16.6 9 5.98 2.55c-.65-.35-1.23-.3-1.58.05L13.6 12 16.6 9Z"
      fill="#00F076"
    />
  </svg>
);

export function AppCta({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-6 rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12 sm:py-16">
        <p className="text-sm font-medium text-primary-foreground/80">
          {t.eyebrow}
        </p>
        <h2 className="max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
          {t.title}
        </h2>
        <p className="max-w-xl text-sm leading-6 text-primary-foreground/80 sm:text-base">
          {t.description}
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#"
            aria-label={`${t.appStoreEyebrow} ${t.appStoreName}`}
            className="flex items-center gap-2 rounded-lg bg-background px-4 py-2.5 text-foreground transition-opacity hover:opacity-85"
          >
            <AppleIcon />
            <span className="leading-tight text-left">
              <span className="block text-[10px] text-muted-foreground">
                {t.appStoreEyebrow}
              </span>
              <span className="block text-sm font-semibold">
                {t.appStoreName}
              </span>
            </span>
          </a>

          <a
            href="#"
            aria-label={`${t.playStoreEyebrow} ${t.playStoreName}`}
            className="flex items-center gap-2 rounded-lg bg-background px-4 py-2.5 text-foreground transition-opacity hover:opacity-85"
          >
            <PlayIcon />
            <span className="leading-tight text-left">
              <span className="block text-[10px] text-muted-foreground">
                {t.playStoreEyebrow}
              </span>
              <span className="block text-sm font-semibold">
                {t.playStoreName}
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

export default AppCta;
