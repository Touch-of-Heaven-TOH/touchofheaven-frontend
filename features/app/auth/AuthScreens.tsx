"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "@/components/app/Icon";
import { Portrait, type LookName } from "@/components/app/art";
import { BusinessCover, Rating, businessKind, businessName } from "@/components/app/ui";
import { VerificationCodeInput } from "@/features/auth/components/VerificationCodeInput";
import { browserApiFetch } from "@/lib/api/browser";
import { ApiClientError } from "@/lib/api/errors";
import { useCity } from "@/lib/app/city";
import { CITIES, useNearby } from "@/lib/app/data";
import { formatDistanceKm } from "@/lib/app/format";
import { getClientEnv } from "@/lib/env/client";
import { safeReturnUrl } from "@/lib/security/safe-return-url";
import { useLang } from "./lang";

/** Must match the backend's SIGNUP_BONUS_CREDITS. */
const SIGNUP_CREDITS = 3;

const STYLES: { look: LookName; en: string; fr: string; category: string }[] = [
  { look: "braids", en: "Knotless braids", fr: "Tresses sans nœuds", category: "braids" },
  { look: "locs", en: "Goddess locs", fr: "Locks bohème", category: "locs" },
  { look: "twists", en: "Twists", fr: "Vanilles", category: "twists" },
  { look: "silk", en: "Silk press", fr: "Brushing lisse", category: "silk-press-styling" },
  { look: "afro", en: "Afro shape", fr: "Afro sculpté", category: "natural-styles" },
  { look: "fade", en: "Skin fade", fr: "Dégradé", category: "barbering" },
];

const INTERESTS: [string, string, string][] = [
  ["braids", "Braids and locs", "Tresses et locks"],
  ["barber", "Barber", "Barbier"],
  ["nails", "Nails", "Ongles"],
  ["makeup", "Makeup", "Maquillage"],
  ["skin", "Skin care", "Soins de la peau"],
  ["spa", "Spa and massage", "Spa et massage"],
];

function errorText(caught: unknown, fallback: string) {
  return caught instanceof ApiClientError ? caught.message : fallback;
}

function Frame({
  children,
  onBack,
  progress,
}: {
  children: React.ReactNode;
  onBack?: () => void;
  progress?: [number, number];
}) {
  const { lang, setLang, t } = useLang();
  return (
    <div className="toh toh-auth">
      <aside className="toh-auth__side" aria-hidden="true">
        <div className="toh-auth__brand">
          <Icon name="crown" size={30} />
          <span className="toh-serif">Touch of Heaven</span>
        </div>
        <div className="toh-collage">
          <div className="toh-art toh-collage__c1">
            <Portrait look="braids" />
          </div>
          <div className="toh-art toh-collage__c2">
            <Portrait look="glam" />
          </div>
          <div className="toh-art toh-collage__c3">
            <Portrait look="fade" />
          </div>
        </div>
        <p className="toh-auth__quote">
          {t("Book trusted braiders, barbers, nail techs and spas in Douala and Yaoundé.", "Réservez des tresseuses, barbiers, prothésistes ongulaires et spas de confiance à Douala et Yaoundé.")}
        </p>
      </aside>
      <main className="toh-auth__main">
        <div className="toh-auth__col">
          <div className="toh-auth__top">
            {onBack ? (
              <button type="button" className="toh-icon-btn" aria-label={t("Back", "Retour")} onClick={onBack}>
                <Icon name="arrowL" />
              </button>
            ) : (
              <Link href="/" className="toh-icon-btn" aria-label={t("Home", "Accueil")}>
                <Icon name="x" />
              </Link>
            )}
            {progress ? (
              <div className="toh-auth__prog">
                <span>
                  {t("Step", "Étape")} {progress[0]} {t("of", "sur")} {progress[1]}
                </span>
                <div className="toh-auth__track">
                  <i style={{ width: `${(progress[0] / progress[1]) * 100}%` }} />
                </div>
              </div>
            ) : (
              <span style={{ flex: 1 }} />
            )}
            <div className="toh-lang" role="group" aria-label="Language">
              <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
                EN
              </button>
              <button type="button" aria-pressed={lang === "fr"} onClick={() => setLang("fr")}>
                FR
              </button>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

function Proof() {
  const { t } = useLang();
  const rows: [IconName, string, string][] = [
    [
      "eye",
      t("See the style first", "Voyez le style d’abord"),
      t("Try looks in AI Studio before you book anyone.", "Essayez des looks dans AI Studio avant de réserver."),
    ],
    [
      "shield",
      t("Only checked businesses", "Seulement des pros vérifiés"),
      t("A business appears only after our team verifies it.", "Un pro n’apparaît qu’après vérification par notre équipe."),
    ],
    [
      "star",
      t("Real reviews only", "Seulement de vrais avis"),
      t("Only clients whose visit was completed can leave a review.", "Seuls les clients dont la visite a eu lieu peuvent laisser un avis."),
    ],
  ];
  return (
    <div className="toh-proof">
      {rows.map(([icon, title, detail]) => (
        <div key={title}>
          <span className="toh-proof__ic">
            <Icon name={icon} size={18} />
          </span>
          <span>
            <b>{title}</b>
            <span>{detail}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function GoogleButton() {
  const { t } = useLang();
  const { apiUrl } = getClientEnv();
  return (
    <a href={`${apiUrl}/api/v1/auth/oauth/google`} className="toh-btn toh-btn--line toh-btn--block toh-btn--lg">
      <Icon name="google" size={18} /> {t("Continue with Google", "Continuer avec Google")}
    </a>
  );
}

type SignUpStep = "welcome" | "preview" | "offer" | "account" | "code" | "profile" | "done";

export function SignUpFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLang();
  const [city, setCity] = useCity();
  const callbackUrl = params.get("callbackUrl");
  const [step, setStep] = useState<SignUpStep>(callbackUrl ? "offer" : "welcome");
  const [history, setHistory] = useState<SignUpStep[]>([]);
  const [look, setLook] = useState(0);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [code, setCode] = useState("");
  const [interests, setInterests] = useState<string[]>(["braids"]);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const go = (next: SignUpStep) => {
    setHistory((list) => [...list, step]);
    setFailure(null);
    setStep(next);
    window.scrollTo({ top: 0 });
  };
  const back = history.length
    ? () => {
        setStep(history[history.length - 1]!);
        setHistory((list) => list.slice(0, -1));
        setFailure(null);
      }
    : undefined;
  const signInHref = `/customer/sign-in${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;

  const createAccount = async () => {
    setBusy(true);
    setFailure(null);
    try {
      await browserApiFetch("/api/v1/auth/signup", {
        method: "POST",
        body: {
          firstName: first.trim(),
          lastName: last.trim(),
          email: email.trim(),
          password,
          confirmPassword: password,
          acceptTerms: true,
          audience: "client",
        },
      });
      go("code");
    } catch (caught) {
      setFailure(errorText(caught, t("We couldn't create your account. Try again.", "Impossible de créer votre compte. Réessayez.")));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value: string) => {
    setBusy(true);
    setFailure(null);
    try {
      await browserApiFetch("/api/v1/auth/verify-email/code", { method: "POST", body: { email: email.trim(), code: value } });
      go("profile");
    } catch (caught) {
      setCode("");
      setFailure(errorText(caught, t("That code didn't work. Try again.", "Ce code ne fonctionne pas. Réessayez.")));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await browserApiFetch("/api/v1/auth/resend-verification", { method: "POST", body: { email: email.trim(), audience: "client" } });
      setResent(true);
    } catch (caught) {
      setFailure(errorText(caught, t("We couldn't resend the code.", "Impossible de renvoyer le code.")));
    }
  };

  const style = STYLES[look]!;

  if (step === "welcome") {
    return (
      <Frame>
        <div className="toh-collage toh-only-phone">
          <div className="toh-art toh-collage__c1">
            <Portrait look="braids" />
          </div>
          <div className="toh-art toh-collage__c2">
            <Portrait look="glam" />
          </div>
          <div className="toh-art toh-collage__c3">
            <Portrait look="fade" />
          </div>
        </div>
        <h1 className="toh-auth__h1">
          {t("See the style on ", "Voyez la coiffure sur ")}
          <em>{t("your", "votre")}</em>
          {t(" face before you sit in the chair.", " visage avant de vous asseoir.")}
        </h1>
        <p className="toh-auth__lede">
          {t(
            "Find trusted braiders, barbers, nail techs and spas near you, and book in a few taps.",
            "Trouvez des tresseuses, barbiers, prothésistes ongulaires et spas de confiance près de chez vous, et réservez en quelques gestes.",
          )}
        </p>
        <Proof />
        <div className="toh-stack">
          <button type="button" className="toh-btn toh-btn--block toh-btn--lg" onClick={() => go("preview")}>
            <Icon name="spark" size={18} /> {t("Try a look now, free", "Essayer un style, gratuit")}
          </button>
          <Link href={signInHref} className="toh-btn toh-btn--line toh-btn--block toh-btn--lg">
            {t("I already have an account", "J’ai déjà un compte")}
          </Link>
        </div>
        <p className="toh-auth__small">
          {t("No account needed to look around.", "Pas besoin de compte pour découvrir.")}{" "}
          <Link href="/business/sign-up?callbackUrl=%2Fprofessional-application" className="toh-link">
            {t("Are you a stylist or salon?", "Vous êtes coiffeur ou salon ?")}
          </Link>
        </p>
      </Frame>
    );
  }

  if (step === "preview") {
    return (
      <Frame onBack={back}>
        <h2 className="toh-auth__h2">{t("Pick a style. See it in seconds.", "Choisissez un style. Voyez-le en quelques secondes.")}</h2>
        <div className="toh-chips" role="group" aria-label={t("Styles", "Styles")}>
          {STYLES.map((item, index) => (
            <button key={item.look} type="button" className={`toh-chip${look === index ? " is-on" : ""}`} onClick={() => setLook(index)}>
              {t(item.en, item.fr)}
            </button>
          ))}
        </div>
        <div className="toh-tryon toh-art">
          <Portrait look={style.look} />
          <span className="toh-tryon__badge">{t("Sample model", "Modèle exemple")}</span>
          <div className="toh-tryon__cap">
            <b>{t(style.en, style.fr)}</b>
          </div>
        </div>
        <div className="toh-sec" style={{ marginTop: 4 }}>
          <h2 style={{ fontSize: 16 }}>{t("Who does this near you", "Qui le fait près de vous")}</h2>
          <select className="toh-sel" value={city.key} onChange={(event) => setCity(event.target.value as "douala" | "yaounde")} aria-label={t("City", "Ville")}>
            {CITIES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <NearbyPros category={style.category} />
        <div className="toh-stack">
          <button type="button" className="toh-btn toh-btn--block toh-btn--lg" onClick={() => go("offer")}>
            {t("Create my free account", "Créer mon compte gratuit")}
          </button>
          <Link href={`/ai-studio?look=${encodeURIComponent(style.en)}`} className="toh-btn toh-btn--line toh-btn--block toh-btn--lg">
            {t("Keep browsing", "Continuer à regarder")}
          </Link>
        </div>
      </Frame>
    );
  }

  if (step === "offer") {
    return (
      <Frame onBack={back}>
        <span className="toh-auth__eyebrow">{t("Free account", "Compte gratuit")}</span>
        <h2 className="toh-auth__h2">{t("Join free. Here’s what you get.", "Inscription gratuite. Voici ce que vous obtenez.")}</h2>
        <div className="toh-gifts">
          <div className="toh-gift">
            <span className="toh-gift__ic is-a">
              <Icon name="spark" size={22} />
            </span>
            <span>
              <b>
                {SIGNUP_CREDITS} {t("free AI Studio credits", "crédits AI Studio offerts")}
              </b>
              <span>{t("Ready in your account the moment you join.", "Disponibles dès votre inscription.")}</span>
            </span>
          </div>
          <div className="toh-gift">
            <span className="toh-gift__ic is-b">
              <Icon name="cal" size={22} />
            </span>
            <span>
              <b>{t("Book with a small deposit", "Réservez avec un petit acompte")}</b>
              <span>{t("MTN MoMo, Orange Money or card. The cancellation policy is shown before you pay.", "MTN MoMo, Orange Money ou carte. La politique d’annulation est affichée avant de payer.")}</span>
            </span>
          </div>
          <div className="toh-gift">
            <span className="toh-gift__ic is-c">
              <Icon name="heart" size={22} />
            </span>
            <span>
              <b>{t("Your favourites and looks, saved", "Vos favoris et styles, enregistrés")}</b>
              <span>{t("Message pros, track bookings and orders in one place.", "Écrivez aux pros, suivez réservations et commandes au même endroit.")}</span>
            </span>
          </div>
        </div>
        <div className="toh-miss">
          <h4>{t("Without an account", "Sans compte")}</h4>
          <ul>
            <li>
              <Icon name="x" size={16} /> {t("You can browse, but not book", "Vous pouvez regarder, mais pas réserver")}
            </li>
            <li>
              <Icon name="x" size={16} /> {t("Looks and favourite pros aren’t saved", "Styles et pros favoris non enregistrés")}
            </li>
          </ul>
        </div>
        <div className="toh-stack">
          <button type="button" className="toh-btn toh-btn--block toh-btn--lg" onClick={() => go("account")}>
            {t("Continue with email", "Continuer avec mon e-mail")}
          </button>
          <div className="toh-or">{t("or", "ou")}</div>
          <GoogleButton />
        </div>
        <p className="toh-auth__small">
          {t("Free. No card, no payment at sign-up. Takes about a minute.", "Gratuit. Ni carte ni paiement à l’inscription. Environ une minute.")}
        </p>
        <p className="toh-auth__small">
          {t("Already have an account?", "Déjà un compte ?")}{" "}
          <Link href={signInHref} className="toh-link">
            {t("Sign in", "Se connecter")}
          </Link>
        </p>
      </Frame>
    );
  }

  if (step === "account") {
    const ready = first.trim() && last.trim() && /\S+@\S+\.\S+/.test(email) && password.length >= 8 && terms;
    return (
      <Frame onBack={back} progress={[1, 3]}>
        <h2 className="toh-auth__h2">{t("Create your account", "Créez votre compte")}</h2>
        <p className="toh-auth__lede">{t("We’ll email you a 6-digit code to confirm it’s you.", "Nous vous envoyons un code à 6 chiffres par e-mail.")}</p>
        <form
          className="toh-stack"
          style={{ gap: 12 }}
          onSubmit={(event) => {
            event.preventDefault();
            if (ready) void createAccount();
          }}
        >
          <div className="toh-grid2">
            <label className="toh-field">
              {t("First name", "Prénom")}
              <input value={first} onChange={(event) => setFirst(event.target.value)} autoComplete="given-name" placeholder={t("e.g. Aïcha", "ex. Aïcha")} />
            </label>
            <label className="toh-field">
              {t("Last name", "Nom")}
              <input value={last} onChange={(event) => setLast(event.target.value)} autoComplete="family-name" />
            </label>
          </div>
          <label className="toh-field">
            {t("Email", "E-mail")}
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" />
          </label>
          <label className="toh-field">
            {t("Password", "Mot de passe")}
            <span className="toh-pw">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? t("Hide password", "Masquer") : t("Show password", "Afficher")}>
                <Icon name="eye" size={18} />
              </button>
            </span>
            <small className="toh-muted" style={{ fontWeight: 500 }}>
              {t("At least 8 characters.", "Au moins 8 caractères.")}
            </small>
          </label>
          <div className="toh-hint">
            <Icon name="phone" size={18} />
            <span>
              <b>{t("WhatsApp sign-in is coming.", "La connexion par WhatsApp arrive bientôt.")}</b>{" "}
              {t("For now we use email. You can add your phone number in your profile.", "Pour l’instant nous utilisons l’e-mail. Ajoutez votre numéro dans votre profil.")}
            </span>
          </div>
          <label className="toh-check">
            <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} />
            <span>
              {t("I agree to the ", "J’accepte les ")}
              <Link href="/legal/terms-of-service" className="toh-link">
                {t("Terms", "Conditions")}
              </Link>
              {t(" and ", " et la ")}
              <Link href="/legal/privacy-policy" className="toh-link">
                {t("Privacy Policy", "Politique de confidentialité")}
              </Link>
              .
            </span>
          </label>
          {failure ? (
            <p role="alert" className="toh-notice toh-notice--error">
              {failure}
            </p>
          ) : null}
          <button className="toh-btn toh-btn--block toh-btn--lg" disabled={!ready || busy}>
            {busy ? t("Creating…", "Création…") : t("Send my code", "Recevoir mon code")}
          </button>
        </form>
      </Frame>
    );
  }

  if (step === "code") {
    return (
      <Frame onBack={back} progress={[2, 3]}>
        <h2 className="toh-auth__h2">{t("Enter your code", "Entrez votre code")}</h2>
        <p className="toh-auth__lede">
          {t("Sent by email to ", "Envoyé par e-mail à ")}
          <b style={{ color: "var(--color-text-primary)" }}>{email}</b>.{" "}
          <button type="button" className="toh-link" onClick={back}>
            {t("Change", "Modifier")}
          </button>
        </p>
        <VerificationCodeInput value={code} onChange={setCode} onComplete={(value) => void verify(value)} disabled={busy} />
        {failure ? (
          <p role="alert" className="toh-notice toh-notice--error">
            {failure}
          </p>
        ) : null}
        <p className="toh-auth__small">
          {resent ? (
            t("A new code is on its way.", "Un nouveau code arrive.")
          ) : (
            <>
              {t("Nothing yet? Check spam, or ", "Rien reçu ? Vérifiez les spams, ou ")}
              <button type="button" className="toh-link" onClick={() => void resend()}>
                {t("send it again", "renvoyez-le")}
              </button>
            </>
          )}
        </p>
        <button type="button" className="toh-btn toh-btn--block toh-btn--lg" disabled={code.length !== 6 || busy} onClick={() => void verify(code)}>
          {busy ? t("Checking…", "Vérification…") : t("Verify", "Vérifier")}
        </button>
      </Frame>
    );
  }

  if (step === "profile") {
    return (
      <Frame progress={[3, 3]}>
        <h2 className="toh-auth__h2">{t("Last step. Make it yours.", "Dernière étape. Personnalisez.")}</h2>
        <p className="toh-auth__lede">{t("So we show pros near you and styles you like.", "Pour vous montrer des pros proches et des styles qui vous plaisent.")}</p>
        <label className="toh-field">
          {t("Your city", "Votre ville")}
          <select value={city.key} onChange={(event) => setCity(event.target.value as "douala" | "yaounde")}>
            {CITIES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <div className="toh-field">
          <span>{t("I’m interested in", "Ça m’intéresse")}</span>
          <div className="toh-chips" style={{ flexWrap: "wrap" }}>
            {INTERESTS.map(([key, en, fr]) => {
              const on = interests.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  className={`toh-chip${on ? " is-on" : ""}`}
                  aria-pressed={on}
                  onClick={() => setInterests(on ? interests.filter((item) => item !== key) : [...interests, key])}
                >
                  {t(en, fr)}
                </button>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          className="toh-btn toh-btn--block toh-btn--lg"
          onClick={() => {
            try {
              localStorage.setItem("toh-interests", JSON.stringify(interests));
            } catch {
              // Not essential.
            }
            go("done");
          }}
        >
          {t("Finish", "Terminer")}
        </button>
      </Frame>
    );
  }

  return (
    <Frame>
      <div className="toh-done">
        <span className="toh-done__av toh-art">
          <Portrait look="bun" />
        </span>
        <h2 className="toh-auth__h2">
          {t("Welcome", "Bienvenue")}, {first.trim()}
        </h2>
        <p className="toh-auth__lede">{t("Your account is ready.", "Votre compte est prêt.")}</p>
      </div>
      <div className="toh-wallet">
        <div>
          <span>{t("AI Studio credits", "Crédits AI Studio")}</span>
          <b>{SIGNUP_CREDITS}</b>
        </div>
        <div>
          <span>{t("City", "Ville")}</span>
          <b>{city.label}</b>
        </div>
      </div>
      <div className="toh-stack">
        {callbackUrl ? (
          <button type="button" className="toh-btn toh-btn--block toh-btn--lg" onClick={() => { router.push(safeReturnUrl(callbackUrl, "/")); router.refresh(); }}>
            {t("Continue where I was", "Reprendre où j’étais")}
          </button>
        ) : null}
        <button type="button" className={`toh-btn toh-btn--block toh-btn--lg${callbackUrl ? " toh-btn--line" : ""}`} onClick={() => { router.push("/businesses"); router.refresh(); }}>
          {t("Find pros near me", "Trouver des pros près de moi")}
        </button>
        <button type="button" className="toh-btn toh-btn--line toh-btn--block toh-btn--lg" onClick={() => { router.push("/ai-studio"); router.refresh(); }}>
          <Icon name="spark" size={18} /> {t("Try a look in AI Studio", "Essayer un style dans AI Studio")}
        </button>
      </div>
    </Frame>
  );
}

function NearbyPros({ category }: { category: string }) {
  const [city] = useCity();
  const { t } = useLang();
  const { businesses, isLoading } = useNearby(city, { category });
  if (isLoading) return <div className="toh-skeleton" style={{ height: 150 }} />;
  if (!businesses.length) {
    return (
      <p className="toh-auth__small" style={{ textAlign: "left" }}>
        {t("No one offers this nearby yet. Try another style or city.", "Personne ne le propose encore ici. Essayez un autre style ou une autre ville.")}
      </p>
    );
  }
  return (
    <div className="toh-pros">
      {businesses.slice(0, 3).map((business) => (
        <Link key={business.id} href={`/businesses/${business.braiderId}`} className="toh-pro">
          <BusinessCover id={business.braiderId} category={business.businessCategory} photoUrl={business.coverPhotoUrl} name={businessName(business)} className="toh-pro__ph" />
          <span className="toh-pro__bd">
            <b>{businessName(business)}</b>
            <Rating average={business.rating.average} count={business.rating.count} size={11} />
            <span className="toh-muted" style={{ fontSize: 11.5 }}>
              {businessKind(business)} · {formatDistanceKm(business.distanceKm)}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

type SignInStep = "email" | "code" | "password";

export function SignInFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLang();
  const callbackUrl = params.get("callbackUrl");
  const [step, setStep] = useState<SignInStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const signUpHref = `/customer/sign-up${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;

  const finish = (data: { mfaRequired?: boolean; postLoginRoute?: string }) => {
    if (data.mfaRequired) {
      router.push(`/mfa?callbackUrl=${encodeURIComponent(safeReturnUrl(callbackUrl, "/"))}`);
      return;
    }
    router.push(safeReturnUrl(callbackUrl, data.postLoginRoute ?? "/"));
    router.refresh();
  };

  const requestCode = async () => {
    setBusy(true);
    setFailure(null);
    try {
      await browserApiFetch("/api/v1/auth/magic-code/request", { method: "POST", body: { email: email.trim() } });
      setCode("");
      setStep("code");
    } catch (caught) {
      setFailure(errorText(caught, t("We couldn't send a code. Try again.", "Impossible d’envoyer un code. Réessayez.")));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value: string) => {
    setBusy(true);
    setFailure(null);
    try {
      finish(await browserApiFetch<{ mfaRequired?: boolean }>("/api/v1/auth/magic-code/verify", { method: "POST", body: { email: email.trim(), code: value } }));
    } catch (caught) {
      setCode("");
      setFailure(errorText(caught, t("That code didn't work. Try again.", "Ce code ne fonctionne pas. Réessayez.")));
      setBusy(false);
    }
  };

  const signIn = async () => {
    setBusy(true);
    setFailure(null);
    try {
      finish(
        await browserApiFetch<{ mfaRequired?: boolean; postLoginRoute?: string }>("/api/v1/auth/login", {
          method: "POST",
          body: { email: email.trim(), password },
        }),
      );
    } catch (caught) {
      setFailure(errorText(caught, t("Email or password is wrong.", "E-mail ou mot de passe incorrect.")));
      setBusy(false);
    }
  };

  const validEmail = /\S+@\S+\.\S+/.test(email);

  return (
    <Frame onBack={step === "email" ? undefined : () => { setStep("email"); setFailure(null); }}>
      <h2 className="toh-auth__h2">{step === "code" ? t("Enter your code", "Entrez votre code") : t("Welcome back", "Bon retour")}</h2>
      {step === "email" ? (
        <>
          <p className="toh-auth__lede">{t("No password needed. We’ll email you a 6-digit code.", "Pas de mot de passe. Nous vous envoyons un code à 6 chiffres par e-mail.")}</p>
          <form
            className="toh-stack"
            style={{ gap: 12 }}
            onSubmit={(event) => {
              event.preventDefault();
              if (validEmail) void requestCode();
            }}
          >
            <label className="toh-field">
              {t("Email", "E-mail")}
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" autoFocus />
            </label>
            {failure ? (
              <p role="alert" className="toh-notice toh-notice--error">
                {failure}
              </p>
            ) : null}
            <button className="toh-btn toh-btn--block toh-btn--lg" disabled={!validEmail || busy}>
              {busy ? t("Sending…", "Envoi…") : t("Send my code", "Recevoir mon code")}
            </button>
          </form>
          <button type="button" className="toh-link" style={{ alignSelf: "center" }} onClick={() => setStep("password")}>
            {t("Use my password instead", "Utiliser mon mot de passe")}
          </button>
          <div className="toh-or">{t("or", "ou")}</div>
          <GoogleButton />
        </>
      ) : step === "password" ? (
        <form
          className="toh-stack"
          style={{ gap: 12 }}
          onSubmit={(event) => {
            event.preventDefault();
            void signIn();
          }}
        >
          <label className="toh-field">
            {t("Email", "E-mail")}
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          </label>
          <label className="toh-field">
            {t("Password", "Mot de passe")}
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          </label>
          {failure ? (
            <p role="alert" className="toh-notice toh-notice--error">
              {failure}
            </p>
          ) : null}
          <button className="toh-btn toh-btn--block toh-btn--lg" disabled={!validEmail || !password || busy}>
            {busy ? t("Signing in…", "Connexion…") : t("Sign in", "Se connecter")}
          </button>
          <Link href="/customer/forgot-password" className="toh-link" style={{ alignSelf: "center" }}>
            {t("Forgot your password?", "Mot de passe oublié ?")}
          </Link>
        </form>
      ) : (
        <>
          <p className="toh-auth__lede">
            {t("Sent by email to ", "Envoyé par e-mail à ")}
            <b style={{ color: "var(--color-text-primary)" }}>{email}</b>. {t("It expires in 10 minutes.", "Il expire dans 10 minutes.")}
          </p>
          <VerificationCodeInput value={code} onChange={setCode} onComplete={(value) => void verify(value)} disabled={busy} />
          {failure ? (
            <p role="alert" className="toh-notice toh-notice--error">
              {failure}
            </p>
          ) : null}
          <button type="button" className="toh-btn toh-btn--block toh-btn--lg" disabled={code.length !== 6 || busy} onClick={() => void verify(code)}>
            {busy ? t("Checking…", "Vérification…") : t("Sign in", "Se connecter")}
          </button>
          <button type="button" className="toh-link" style={{ alignSelf: "center" }} onClick={() => void requestCode()} disabled={busy}>
            {t("Send a new code", "Renvoyer un code")}
          </button>
        </>
      )}
      <p className="toh-auth__small">
        {t("New here?", "Nouveau ici ?")}{" "}
        <Link href={signUpHref} className="toh-link">
          {t("Create a free account", "Créer un compte gratuit")}
        </Link>
      </p>
      <p className="toh-auth__small">
        {t("Own a beauty business?", "Vous avez un salon ?")}{" "}
        <Link href="/business/sign-in" className="toh-link">
          {t("Sign in to your Studio", "Connectez-vous à votre Studio")}
        </Link>
      </p>
    </Frame>
  );
}

