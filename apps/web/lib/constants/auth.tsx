import { useEffect, useState } from "react";
import { Locale } from "../language";
import Logo from "@/components/global/logo";
import { cn } from "../utils";

export const STRINGS = {
  en: {
    noAccount: "Don't have an account?",
    signUp: "Sign up",
    signIn: "Sign in",
    continueWith: "Continue with",
    google: "Google",
    apple: "Apple",
    passkey: "Passkey",
    orContinueWithEmail: "Or continue with email address",
    emailLabel: "Email address",
    emailPlaceholder: "you@email.com",
    useEmailPassword: "Use email & password",
    passwordLabel: "Password",
    passwordPlaceholder: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    continueWithEmail: "Continue with email",
    signInButton: "Sign in",
    forgotPassword: "Forgot Password",
  },
  fr: {
    noAccount: "Vous n'avez pas de compte ?",
    signUp: "S'inscrire",
    signIn: "Connexion",
    continueWith: "Continuer avec",
    google: "Google",
    apple: "Apple",
    passkey: "Clé d'accès",
    orContinueWithEmail: "Ou continuer avec une adresse e-mail",
    emailLabel: "Adresse e-mail",
    emailPlaceholder: "vous@email.com",
    useEmailPassword: "Utiliser e-mail et mot de passe",
    passwordLabel: "Mot de passe",
    passwordPlaceholder: "Mot de passe",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
    continueWithEmail: "Continuer avec e-mail",
    signInButton: "Se connecter",
    forgotPassword: "Mot de passe oublier",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export const SIGNUP_STRINGS = {
  en: {
    title: "Create Account",

    alreadyHaveAccount: "Already have an account?",
    signIn: "Sign in",

    name: "Name",
    namePlaceholder: "Your full name",

    email: "Email",
    emailPlaceholder: "m@example.com",

    createAccount: "Create Account",

    or: "Or",

    continueWithGoogle: "Continue with Google",
    continueWithApple: "Continue with Apple",
  },

  fr: {
    title: "Créer un compte",

    alreadyHaveAccount: "Vous avez déjà un compte ?",
    signIn: "Se connecter",

    name: "Nom",
    namePlaceholder: "Votre nom complet",

    email: "E-mail",
    emailPlaceholder: "exemple@email.com",

    createAccount: "Créer un compte",

    or: "Ou",

    continueWithGoogle: "Continuer avec Google",
    continueWithApple: "Continuer avec Apple",
  },
} as const;

export const CAPTIONS = {
  en: [
    "Discover trusted local sellers in Goma and shop for everything you need, all in one place.",
    "Shop with confidence, knowing your orders are handled securely from checkout to final delivery.",
    "Find the products you love, place your order in just a few taps, and have them delivered to your doorstep.",
    "Built to make local shopping faster and easier, connecting buyers, sellers, and riders in one seamless experience.",
  ],

  fr: [
    "Découvrez des vendeurs locaux de confiance à Goma et trouvez tout ce dont vous avez besoin au même endroit.",
    "Achetez en toute confiance, avec un suivi sécurisé de votre commande jusqu'à sa livraison finale.",
    "Trouvez les produits que vous aimez, commandez en quelques clics et faites-vous livrer directement à votre porte.",
    "Pensé pour rendre le commerce local plus simple et plus rapide, en connectant acheteurs, vendeurs et livreurs sur une même plateforme.",
  ],
} as const satisfies Record<Locale, readonly string[]>;

export const CAPTION_INTERVAL_MS = 5000;
export const CAPTION_TRANSITION_MS = 400;

export const IllustrationPanel = ({ locale }: { locale: Locale }) => {
  return (
    <div className="relative hidden h-full w-full flex-col items-start justify-between overflow-hidden rounded-l-xl bg-muted p-6 md:flex">
      <div className="z-10 flex h-9 w-9 items-center justify-center rounded-sm border border-primary shadow-sm">
        <Logo variant="icon" />
      </div>

      <img
        src="https://res.cloudinary.com/dx3wclabo/image/upload/v1787155844/2151150194_nkuxrn.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="relative z-10 w-full">
        <RotatingCaption locale={locale} className="text-white" />
      </div>
    </div>
  );
};

export const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#FFC107"
      d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.3 5.1 29.4 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z"
    />
    <path
      fill="#FF3D00"
      d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.3 5.1 29.4 3 24 3 16.3 3 9.7 7.3 6.3 14.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 36.6 26.7 37.5 24 37.5c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 40.6 16.3 45 24 45z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C40.7 36 44 30.5 44 24c0-1.4-.1-2.7-.4-3.5z"
    />
  </svg>
);

export const RotatingCaption = ({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) => {
  const captions = CAPTIONS[locale];

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);

      setTimeout(() => {
        setIndex((current) => (current + 1) % captions.length);
        setVisible(true);
      }, CAPTION_TRANSITION_MS);
    }, CAPTION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [captions.length]);

  useEffect(() => {
    setIndex(0);
    setVisible(true);
  }, [locale]);

  return (
    <span
      className={cn(
        "block text-xs font-medium text-muted-foreground",
        "transition-all duration-400 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      )}
    >
      {captions[index]}
    </span>
  );
};
