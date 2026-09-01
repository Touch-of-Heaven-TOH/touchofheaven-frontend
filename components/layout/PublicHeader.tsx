"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu as MenuIcon, Store, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { brandAssets } from "@/config/site";
import type { SafeUser } from "@/types/auth";

export type PublicHeaderProps = {
  user: SafeUser | null;
};

const languageOptions = [
  {
    id: "en",
    name: "English",
    businessHeading: "For businesses",
    customerHeading: "For customers",
    auth: "Log in or sign up",
    signIn: "Sign in",
    createAccount: "Create account",
    home: "Home",
    downloadApp: "Download the app",
    blog: "Blog",
    help: "Help and support",
    switchToCustomers: "For customers",
    switchToBusiness: "For business",
    comingSoon: "Coming soon",
    language: "English",
  },
  {
    id: "fr",
    name: "Francais",
    businessHeading: "Pour les entreprises",
    customerHeading: "Pour les clients",
    auth: "Connexion ou inscription",
    signIn: "Se connecter",
    createAccount: "Creer un compte",
    home: "Accueil",
    downloadApp: "Telecharger l'application",
    blog: "Blog",
    help: "Aide et support",
    switchToCustomers: "Pour les clients",
    switchToBusiness: "Pour les entreprises",
    comingSoon: "Bientot disponible",
    language: "Francais",
  },
  {
    id: "es",
    name: "Espanol",
    businessHeading: "Para negocios",
    customerHeading: "Para clientes",
    auth: "Iniciar sesion o registrarse",
    signIn: "Iniciar sesion",
    createAccount: "Crear cuenta",
    home: "Inicio",
    downloadApp: "Descargar la app",
    blog: "Blog",
    help: "Ayuda y soporte",
    switchToCustomers: "Para clientes",
    switchToBusiness: "Para negocios",
    comingSoon: "Proximamente",
    language: "Espanol",
  },
  {
    id: "pt",
    name: "Portugues",
    businessHeading: "Para empresas",
    customerHeading: "Para clientes",
    auth: "Entrar ou criar conta",
    signIn: "Entrar",
    createAccount: "Criar conta",
    home: "Inicio",
    downloadApp: "Baixar o app",
    blog: "Blog",
    help: "Ajuda e suporte",
    switchToCustomers: "Para clientes",
    switchToBusiness: "Para empresas",
    comingSoon: "Em breve",
    language: "Portugues",
  },
  {
    id: "sw",
    name: "Kiswahili",
    businessHeading: "Kwa biashara",
    customerHeading: "Kwa wateja",
    auth: "Ingia au jisajili",
    signIn: "Ingia",
    createAccount: "Fungua akaunti",
    home: "Nyumbani",
    downloadApp: "Pakua app",
    blog: "Blogu",
    help: "Msaada na huduma",
    switchToCustomers: "Kwa wateja",
    switchToBusiness: "Kwa biashara",
    comingSoon: "Inakuja hivi karibuni",
    language: "Kiswahili",
  },
  {
    id: "ar",
    name: "Arabic",
    businessHeading: "للاعمال",
    customerHeading: "للعملاء",
    auth: "تسجيل الدخول او الاشتراك",
    signIn: "تسجيل الدخول",
    createAccount: "إنشاء حساب",
    home: "الرئيسية",
    downloadApp: "تنزيل التطبيق",
    blog: "المدونة",
    help: "المساعدة والدعم",
    switchToCustomers: "للعملاء",
    switchToBusiness: "للاعمال",
    comingSoon: "قريبا",
    language: "العربية",
  },
];

export function PublicHeader({ user }: PublicHeaderProps) {
  const [open, setOpen] = useState(false);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [selectedLanguageId, setSelectedLanguageId] = useState("en");
  const pathname = usePathname();
  const selectedLanguage =
    languageOptions.find((language) => language.id === selectedLanguageId) ??
    languageOptions[0];
  const businessPrimaryLinks = [
    { label: "Business types", href: "/for-clients#coming-next" },
    { label: "Features", href: "/for-clients" },
    { label: "Pricing", href: "/marketplace" },
  ];
  const professionalLink = user?.roles.includes("BRAIDER")
    ? { label: "My Studio", href: "/studio/today" }
    : { label: "List your business", href: "/professional-application" };
  const isBusinessHeader = pathname !== "/for-clients";
  const authHref = user
    ? "/account"
    : isBusinessHeader
      ? "/business/sign-in"
      : "/customer/sign-in";
  const dropdownHeading = isBusinessHeader
    ? selectedLanguage.businessHeading
    : selectedLanguage.customerHeading;
  const switchItem = isBusinessHeader
    ? { label: selectedLanguage.switchToCustomers, href: "/for-clients" }
    : { label: selectedLanguage.switchToBusiness, href: "/" };

  const handleMenuToggle = () => {
    setOpen((value) => {
      if (value) {
        setLanguageDialogOpen(false);
      }

      return !value;
    });
  };

  const closeMenu = () => {
    setOpen(false);
    setLanguageDialogOpen(false);
  };

  return (
    <header className="sticky top-0 z-[var(--z-header)] border-b border-transparent bg-[var(--color-page)]/90 backdrop-blur-xl">
      <div className="page-container flex min-h-[72px] items-center justify-between gap-4">
        <Link
          className="flex min-w-0 items-center gap-3 font-bold text-[var(--color-text-primary)]"
          href="/"
          aria-label="Touch of Heaven home"
        >
          <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-[var(--color-brand-soft)]">
            <Image
              alt=""
              className="object-contain p-1"
              fill
              sizes="40px"
              src={brandAssets.logoMark}
            />
          </span>
          <span className="hidden sm:inline">Touch of Heaven</span>
        </Link>

        {isBusinessHeader ? (
          <nav
            className="hidden items-center gap-7 lg:flex"
            aria-label="Business primary"
          >
            {businessPrimaryLinks.map((item) => (
              <Link
                className="text-sm font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-brand)]"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="relative flex items-center gap-2 sm:gap-3">
          {isBusinessHeader && !user ? (
            <Link
              className="hidden min-h-11 items-center px-2 text-sm font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-brand)] sm:inline-flex"
              href="/business/sign-in"
            >
              {selectedLanguage.signIn}
            </Link>
          ) : null}
          {isBusinessHeader ? (
            <Link
              className="hidden min-h-12 items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/78 px-5 text-sm font-bold text-[var(--color-text-primary)] shadow-[var(--shadow-subtle)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] md:inline-flex"
              href="/for-clients"
            >
              <Store aria-hidden="true" size={18} />
              Marketplace
            </Link>
          ) : (
            <Link
              className="hidden min-h-11 items-center px-2 text-sm font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-brand)] sm:inline-flex"
              href={user ? "/account" : "/customer/sign-in"}
            >
              {user ? "Account" : "Log in"}
            </Link>
          )}
          <Link
            className={
              isBusinessHeader
                ? "hidden min-h-12 items-center rounded-full bg-[var(--color-brand-strong)] px-5 text-sm font-bold text-white shadow-[var(--shadow-subtle)] transition hover:bg-[var(--color-brand)] sm:inline-flex"
                : "hidden min-h-12 items-center rounded-full border border-[var(--color-border)] bg-white/78 px-5 text-sm font-bold text-[var(--color-text-primary)] shadow-[var(--shadow-subtle)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] sm:inline-flex"
            }
            href={
              isBusinessHeader
                ? user
                  ? "/account"
                  : "/business/sign-up"
                : user
                  ? "/account"
                  : "/customer/sign-up"
            }
          >
            {isBusinessHeader
              ? user
                ? "Account"
                : "Sign up"
              : user
                ? "Account"
                : selectedLanguage.createAccount}
          </Link>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-white/78 px-4 text-sm font-bold text-[var(--color-text-primary)] shadow-[var(--shadow-subtle)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] sm:px-5"
            type="button"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="public-navigation-menu"
            onClick={handleMenuToggle}
          >
            <span>Menu</span>
            {open ? (
              <X aria-hidden="true" size={20} />
            ) : (
              <MenuIcon aria-hidden="true" size={20} />
            )}
          </button>

          {open ? (
            <div
              id="public-navigation-menu"
              className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-[var(--color-border)] bg-white/98 p-3 text-[var(--color-text-primary)] shadow-[var(--shadow-soft)] backdrop-blur-xl"
            >
              <div className="px-3 pb-2 pt-1 text-sm font-bold text-[var(--color-text-muted)]">
                {dropdownHeading}
              </div>
              <nav className="grid gap-1" aria-label="Menu">
                <Link
                  className="rounded-md px-3 py-3 text-sm font-semibold transition hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
                  href={authHref}
                  onClick={closeMenu}
                >
                  {selectedLanguage.auth}
                </Link>

                {isBusinessHeader ? (
                  <Link
                    className="rounded-md px-3 py-3 text-sm font-semibold transition hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
                    href="/"
                    onClick={closeMenu}
                  >
                    {selectedLanguage.home}
                  </Link>
                ) : (
                  <Link
                    className="rounded-md px-3 py-3 text-sm font-semibold transition hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
                    href={professionalLink.href}
                    onClick={closeMenu}
                  >
                    {professionalLink.label}
                  </Link>
                )}

                <button
                  className="flex w-full cursor-not-allowed items-center justify-between rounded-md px-3 py-3 text-left text-sm font-semibold text-[var(--color-text-muted)]"
                  type="button"
                  disabled
                >
                  <span>{selectedLanguage.downloadApp}</span>
                  <span className="text-xs font-bold uppercase tracking-[0.08em]">
                    {selectedLanguage.comingSoon}
                  </span>
                </button>

                <button
                  className="flex w-full cursor-not-allowed items-center justify-between rounded-md px-3 py-3 text-left text-sm font-semibold text-[var(--color-text-muted)]"
                  type="button"
                  disabled
                >
                  <span>{selectedLanguage.blog}</span>
                  <span className="text-xs font-bold uppercase tracking-[0.08em]">
                    {selectedLanguage.comingSoon}
                  </span>
                </button>

                <Link
                  className="rounded-md px-3 py-3 text-sm font-semibold transition hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
                  href="/support"
                  onClick={closeMenu}
                >
                  {selectedLanguage.help}
                </Link>

                <button
                  className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm font-semibold transition hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
                  type="button"
                  onClick={() => setLanguageDialogOpen(true)}
                >
                  <span>{selectedLanguage.language}</span>
                  <span aria-hidden="true">›</span>
                </button>

                <div className="my-1 border-t border-[var(--color-border)]" />

                <Link
                  className="rounded-md px-3 py-3 text-sm font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-soft)]"
                  href={switchItem.href}
                  onClick={closeMenu}
                >
                  {switchItem.label}
                </Link>
              </nav>
            </div>
          ) : null}
        </div>
      </div>

      {languageDialogOpen ? (
        <div
          className="fixed inset-0 z-[calc(var(--z-header)+1)] flex items-start justify-center bg-black/20 px-4 pt-24 backdrop-blur-sm"
          role="presentation"
          onMouseDown={() => setLanguageDialogOpen(false)}
        >
          <div
            aria-labelledby="language-dialog-title"
            aria-modal="true"
            className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-soft)]"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
              <h2
                id="language-dialog-title"
                className="text-base font-bold text-[var(--color-text-primary)]"
              >
                Choose language
              </h2>
              <button
                aria-label="Close language dialog"
                className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-primary)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
                type="button"
                onClick={() => setLanguageDialogOpen(false)}
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            <div className="grid gap-2 pt-4 sm:grid-cols-2">
              {languageOptions.map((language) => (
                <button
                  className={`rounded-md border px-3 py-3 text-left text-sm font-semibold transition ${
                    selectedLanguageId === language.id
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                      : "border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
                  }`}
                  key={language.id}
                  type="button"
                  onClick={() => {
                    setSelectedLanguageId(language.id);
                    setLanguageDialogOpen(false);
                  }}
                >
                  {language.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
