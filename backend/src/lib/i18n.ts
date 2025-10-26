import { Request } from "express";

import { ApiResponse } from "../types";

export type Locale = "en" | "fr";

type TranslationCatalog = Record<string, string>;

type TranslationMap = Record<Locale, TranslationCatalog>;

const FALLBACK_LOCALE: Locale = "en";

const CATALOG: TranslationMap = {
  en: {
    "auth.signup.exists": "A user with this email already exists.",
    "auth.signup.success": "Sign up successful.",
    "auth.signup.error": "Unable to complete the sign up process.",
    "auth.login.invalid_credentials": "Incorrect email or password.",
    "auth.login.account_inactive": "This account is disabled.",
    "auth.login.otp_required": "One-time password required.",
    "auth.login.success": "Signed in successfully.",
    "auth.login.error": "Unable to sign in right now.",
    "auth.logout.success": "Signed out successfully.",
    "auth.otp.invalid": "Invalid one-time password.",
    "auth.otp.setup_started": "Two-factor authentication setup started.",
    "auth.otp.setup_error": "Unable to start two-factor authentication setup.",
    "auth.otp.config_missing": "Two-factor configuration not found.",
    "auth.otp.verified": "One-time password verified successfully.",
    "auth.otp.verify_error": "Unable to verify the one-time password.",
    "auth.otp.disabled": "Two-factor authentication disabled successfully.",
    "auth.otp.disable_error": "Unable to disable two-factor authentication.",
    "auth.otp.backup_missing": "No backup codes found.",
    "auth.otp.backup_retrieved": "Backup codes retrieved successfully.",
    "auth.otp.backup_error": "Unable to retrieve backup codes.",
    "auth.password.current_invalid": "Current password is incorrect.",
    "auth.password.changed": "Password changed successfully.",
    "auth.password.change_error": "Unable to change the password.",
    "auth.password.reset_request_error": "Error while requesting password reset.",
    "auth.password.reset_email_failed": "Failed to send reset instructions.",
    "auth.password.reset_email_sent": "Reset instructions sent to your email.",
    "auth.password.reset_token_invalid": "Invalid reset token.",
    "auth.password.reset_success": "Password reset successfully.",
    "auth.password.reset_error": "Unable to reset the password.",
    "project.default.name": "My project",
    "project.default.description": "Project created automatically.",
    "project.errors.fetch_list": "Error fetching projects.",
    "project.errors.not_found": "Project not found.",
    "project.errors.fetch_single": "Error fetching project.",
    "project.errors.fetch_links": "Error fetching project links.",
    "project.errors.fetch_stats": "Error fetching project stats.",
    "project.errors.create": "Error creating project.",
    "project.errors.update_forbidden": "Only project owners can update.",
    "project.errors.update": "Error updating project.",
    "project.errors.delete_forbidden": "Only project owners can delete.",
    "project.errors.delete": "Error deleting project.",
    "project.errors.fetch_members": "Error fetching project members.",
    "project.errors.invite_forbidden": "Only project owners can invite members.",
    "project.errors.invite_email_required": "Member email is required.",
    "project.errors.invite_self": "Owners do not need to invite themselves.",
    "project.errors.invite_owner": "The project owner already has access.",
    "project.errors.invite_duplicate": "User is already a project member.",
    "project.errors.invite_failure": "Error adding project member.",
    "project.errors.member_not_found": "Project member not found.",
    "project.errors.remove_forbidden": "Not authorized to remove this member.",
    "project.errors.remove_failure": "Error removing project member.",
    "project.errors.not_found_or_denied": "Project not found or access denied.",
    "project.errors.id_required": "Project ID is required.",
    "project.success.links_retrieved": "Links retrieved successfully.",
    "project.errors.links": "Error retrieving project links.",
    "user.list.success": "Users retrieved successfully.",
    "user.list.error": "Error fetching users.",
    "user.create.exists": "A user with this email already exists.",
    "user.create.success": "User created successfully.",
    "user.create.error": "Error creating user.",
    "user.get.success": "User retrieved successfully.",
    "user.get.error": "Error fetching user.",
    "user.update.success": "User updated successfully.",
    "user.update.error": "Error updating user.",
    "user.delete.success": "User deleted successfully.",
    "user.delete.error": "Error deleting user.",
    "user.tips.marked": "Tip marked as seen.",
    "user.tips.error": "Error updating seen tips.",
    "user.theme.invalid_value": "Invalid theme value.",
    "user.theme.success": "Theme updated successfully.",
    "user.theme.error": "Error updating theme.",
    "user.last_project.invalid_id": "Invalid project ID.",
    "user.last_project.success": "Last project ID updated successfully.",
    "user.last_project.error": "Error updating last project ID.",
    "common.errors.unauthenticated": "User not authenticated.",
    "common.errors.authentication_required": "Authentication required.",
    "common.errors.user_not_found": "User not found.",
    "common.errors.project_access_denied": "Project not found or access denied.",
    "common.errors.token_invalid_or_expired": "The token is invalid or has expired.",
    "common.errors.unexpected": "An unexpected error occurred.",
    "link.password.session_required": "Password required to access this link.",
    "link.password.session_invalid": "Invalid or expired password session.",
    "link.password.missing": "Password is required.",
    "link.password.not_found": "Link not found or not password protected.",
    "link.password.invalid": "Invalid password.",
    "link.password.validated": "Password validated successfully.",
    "link.password.rate_limited": "Too many failed attempts. Please try again later.",
    "email.reset.subject": "Password Reset Request",
    "email.reset.intro": "You requested a password reset.",
    "email.reset.instructions": "Click the link below to reset your password:",
    "email.reset.link_text": "Reset my password",
    "email.invite.subject": "You've been invited to {{projectName}}",
    "email.invite.heading": "You've been invited to join {{projectName}}",
    "email.invite.body": "{{inviterEmail}} has added you as a member of the <strong>{{projectName}}</strong> project.",
    "email.invite.secondary": "Sign in to your referral tool account to collaborate with the rest of the team.",
    "email.invite.footer": "If you believe this invitation was sent in error, you can safely ignore this message.",
    "email.invite.cta": "Go to rflnk.com",
    "template.password.title": "Password Protected Link",
    "template.password.description": "This link is protected. Please enter the password to continue.",
    "template.password.placeholder": "Enter password",
    "template.password.submit": "Continue",
    "template.password.validating": "Validating...",
    "template.password.generic_error": "An error occurred. Please try again.",
    "template.password.invalid_fallback": "Invalid password",
    "template.404.title": "Page Not Found - rflnk.com",
    "template.404.heading": "404",
    "template.404.description_primary": "The link you're looking for doesn't seem to exist or might have expired.",
    "template.404.description_secondary": "Please check the URL or contact the person who shared it with you.",
    "template.404.cta": "Return Home",
  },
  fr: {
    "auth.signup.exists": "Un utilisateur avec cet email existe déjà.",
    "auth.signup.success": "Inscription réussie.",
    "auth.signup.error": "Impossible de finaliser l'inscription.",
    "auth.login.invalid_credentials": "Email ou mot de passe incorrect.",
    "auth.login.account_inactive": "Ce compte est désactivé.",
    "auth.login.otp_required": "Code OTP requis.",
    "auth.login.success": "Connexion réussie.",
    "auth.login.error": "Impossible de vous connecter pour le moment.",
    "auth.logout.success": "Déconnexion réussie.",
    "auth.otp.invalid": "Code OTP invalide.",
    "auth.otp.setup_started": "Configuration de l'authentification à deux facteurs démarrée.",
    "auth.otp.setup_error": "Impossible de démarrer la configuration de l'authentification à deux facteurs.",
    "auth.otp.config_missing": "Configuration OTP introuvable.",
    "auth.otp.verified": "Code OTP vérifié avec succès.",
    "auth.otp.verify_error": "Impossible de vérifier le code OTP.",
    "auth.otp.disabled": "Authentification à deux facteurs désactivée avec succès.",
    "auth.otp.disable_error": "Impossible de désactiver l'authentification à deux facteurs.",
    "auth.otp.backup_missing": "Aucun code de secours trouvé.",
    "auth.otp.backup_retrieved": "Codes de secours récupérés avec succès.",
    "auth.otp.backup_error": "Impossible de récupérer les codes de secours.",
    "auth.password.current_invalid": "Mot de passe actuel incorrect.",
    "auth.password.changed": "Mot de passe changé avec succès.",
    "auth.password.change_error": "Impossible de changer le mot de passe.",
    "auth.password.reset_request_error": "Erreur lors de la demande de réinitialisation du mot de passe.",
    "auth.password.reset_email_failed": "Impossible d'envoyer les instructions de réinitialisation.",
    "auth.password.reset_email_sent": "Instructions de réinitialisation envoyées par email.",
    "auth.password.reset_token_invalid": "Token de réinitialisation invalide.",
    "auth.password.reset_success": "Mot de passe réinitialisé avec succès.",
    "auth.password.reset_error": "Impossible de réinitialiser le mot de passe.",
    "project.default.name": "Mon projet",
    "project.default.description": "Projet créé automatiquement.",
    "project.errors.fetch_list": "Erreur lors de la récupération des projets.",
    "project.errors.not_found": "Projet introuvable.",
    "project.errors.fetch_single": "Erreur lors de la récupération du projet.",
    "project.errors.fetch_links": "Erreur lors de la récupération des liens du projet.",
    "project.errors.fetch_stats": "Erreur lors de la récupération des statistiques du projet.",
    "project.errors.create": "Erreur lors de la création du projet.",
    "project.errors.update_forbidden": "Seuls les propriétaires du projet peuvent le modifier.",
    "project.errors.update": "Erreur lors de la mise à jour du projet.",
    "project.errors.delete_forbidden": "Seuls les propriétaires du projet peuvent le supprimer.",
    "project.errors.delete": "Erreur lors de la suppression du projet.",
    "project.errors.fetch_members": "Erreur lors de la récupération des membres du projet.",
    "project.errors.invite_forbidden": "Seuls les propriétaires du projet peuvent inviter des membres.",
    "project.errors.invite_email_required": "L'email du membre est requis.",
    "project.errors.invite_self": "Les propriétaires n'ont pas besoin de s'inviter eux-mêmes.",
    "project.errors.invite_owner": "Le propriétaire du projet a déjà accès.",
    "project.errors.invite_duplicate": "L'utilisateur est déjà membre du projet.",
    "project.errors.invite_failure": "Erreur lors de l'ajout du membre au projet.",
    "project.errors.member_not_found": "Membre du projet introuvable.",
    "project.errors.remove_forbidden": "Non autorisé à retirer ce membre.",
    "project.errors.remove_failure": "Erreur lors du retrait du membre du projet.",
    "project.errors.not_found_or_denied": "Projet introuvable ou accès refusé.",
    "project.errors.id_required": "L'identifiant du projet est requis.",
    "project.success.links_retrieved": "Liens récupérés avec succès.",
    "project.errors.links": "Erreur lors de la récupération des liens du projet.",
    "user.list.success": "Utilisateurs récupérés avec succès.",
    "user.list.error": "Erreur lors de la récupération des utilisateurs.",
    "user.create.exists": "Un utilisateur avec cet email existe déjà.",
    "user.create.success": "Utilisateur créé avec succès.",
    "user.create.error": "Erreur lors de la création de l'utilisateur.",
    "user.get.success": "Utilisateur récupéré avec succès.",
    "user.get.error": "Erreur lors de la récupération de l'utilisateur.",
    "user.update.success": "Utilisateur mis à jour avec succès.",
    "user.update.error": "Erreur lors de la mise à jour de l'utilisateur.",
    "user.delete.success": "Utilisateur supprimé avec succès.",
    "user.delete.error": "Erreur lors de la suppression de l'utilisateur.",
    "user.tips.marked": "Astuce marquée comme vue.",
    "user.tips.error": "Erreur lors de la mise à jour des astuces vues.",
    "user.theme.invalid_value": "Valeur de thème invalide.",
    "user.theme.success": "Thème mis à jour avec succès.",
    "user.theme.error": "Erreur lors de la mise à jour du thème.",
    "user.last_project.invalid_id": "Identifiant de projet invalide.",
    "user.last_project.success": "Dernier projet mis à jour avec succès.",
    "user.last_project.error": "Erreur lors de la mise à jour du dernier projet.",
    "common.errors.unauthenticated": "Utilisateur non authentifié.",
    "common.errors.authentication_required": "Authentification requise.",
    "common.errors.user_not_found": "Utilisateur introuvable.",
    "common.errors.project_access_denied": "Projet introuvable ou accès refusé.",
    "common.errors.token_invalid_or_expired": "Le jeton est invalide ou expiré.",
    "common.errors.unexpected": "Une erreur inattendue s'est produite.",
    "link.password.session_required": "Mot de passe requis pour accéder à ce lien.",
    "link.password.session_invalid": "Session de mot de passe invalide ou expirée.",
    "link.password.missing": "Le mot de passe est requis.",
    "link.password.not_found": "Lien introuvable ou non protégé par mot de passe.",
    "link.password.invalid": "Mot de passe invalide.",
    "link.password.validated": "Mot de passe validé avec succès.",
    "link.password.rate_limited": "Trop de tentatives échouées. Veuillez réessayer plus tard.",
    "email.reset.subject": "Demande de réinitialisation du mot de passe",
    "email.reset.intro": "Vous avez demandé une réinitialisation de mot de passe.",
    "email.reset.instructions": "Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :",
    "email.reset.link_text": "Réinitialiser mon mot de passe",
    "email.invite.subject": "Vous avez été invité sur {{projectName}}",
    "email.invite.heading": "Vous avez été invité à rejoindre {{projectName}}",
    "email.invite.body": "{{inviterEmail}} vous a ajouté en tant que membre du projet <strong>{{projectName}}</strong>.",
    "email.invite.secondary": "Connectez-vous à votre compte Referral Tool pour collaborer avec le reste de l'équipe.",
    "email.invite.footer": "Si vous pensez que cette invitation est une erreur, vous pouvez ignorer ce message.",
    "email.invite.cta": "Aller sur rflnk.com",
    "template.password.title": "Lien protégé par mot de passe",
    "template.password.description": "Ce lien est protégé. Veuillez saisir le mot de passe pour continuer.",
    "template.password.placeholder": "Entrer le mot de passe",
    "template.password.submit": "Continuer",
    "template.password.validating": "Validation...",
    "template.password.generic_error": "Une erreur s'est produite. Veuillez réessayer.",
    "template.password.invalid_fallback": "Mot de passe invalide",
    "template.404.title": "Page introuvable - rflnk.com",
    "template.404.heading": "404",
    "template.404.description_primary": "Le lien que vous recherchez n'existe pas ou a expiré.",
    "template.404.description_secondary": "Veuillez vérifier l'URL ou contacter la personne qui vous l'a partagée.",
    "template.404.cta": "Retour à l'accueil",
  },
};

const ACCEPT_LANGUAGE_SPLIT = /,\s*/;

function normalizeLocale(value?: string | null): Locale | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.toLowerCase();
  if (normalized.startsWith("fr")) {
    return "fr";
  }
  if (normalized.startsWith("en")) {
    return "en";
  }
  return undefined;
}

function parseAcceptLanguage(
  header?: string | string[]
): Locale | undefined {
  if (!header) {
    return undefined;
  }
  const raw = Array.isArray(header) ? header[0] : header;
  if (!raw) {
    return undefined;
  }
  const segments = raw.split(ACCEPT_LANGUAGE_SPLIT);
  for (const segment of segments) {
    const [language] = segment.split(";");
    const normalized = normalizeLocale(language?.trim());
    if (normalized) {
      return normalized;
    }
  }
  return undefined;
}

export interface LocaleResolutionOptions {
  req?: Request;
  acceptLanguage?: string | string[];
  userLocale?: string | null;
  projectLocale?: string | null;
  explicitLocale?: string | null;
}

export function resolveLocale(
  options: LocaleResolutionOptions = {}
): Locale {
  const acceptLanguageHeader = options.req?.headers
    ? (options.req.headers["accept-language"] as string | string[] | undefined)
    : undefined;

  return (
    normalizeLocale(options.explicitLocale) ||
    normalizeLocale(options.projectLocale) ||
    normalizeLocale(options.userLocale) ||
    parseAcceptLanguage(options.acceptLanguage ?? acceptLanguageHeader) ||
    FALLBACK_LOCALE
  );
}

export interface Translator {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function getTemplate(locale: Locale, key: string): string {
  const localized = CATALOG[locale]?.[key];
  if (localized) {
    return localized;
  }
  const fallback = CATALOG[FALLBACK_LOCALE]?.[key];
  if (fallback) {
    return fallback;
  }
  return key;
}

function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{\{(.*?)\}\}/g, (_, token: string) => {
    const trimmed = token.trim();
    const value = params[trimmed];
    return typeof value === "undefined" ? `{{${trimmed}}}` : String(value);
  });
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const template = getTemplate(locale, key);
  return interpolate(template, params);
}

export function createTranslator(
  options: LocaleResolutionOptions = {}
): Translator {
  const locale = resolveLocale(options);
  if (options.req) {
    options.req.locale = locale;
  }
  return {
    locale,
    t: (key, params) => translate(locale, key, params),
  };
}

export interface LocalizedResponseOptions<T> {
  params?: Record<string, string | number>;
  data?: T;
  error?: unknown;
  extra?: Record<string, unknown>;
}

export function buildLocalizedResponse<T>(
  translator: Translator,
  key: string,
  options: LocalizedResponseOptions<T> = {}
): ApiResponse<T> & { messageKey: string } {
  const { params, data, error, extra } = options;
  const response: ApiResponse<T> & { messageKey: string } = {
    messageKey: key,
    message: translator.t(key, params),
  };

  if (typeof data !== "undefined") {
    response.data = data;
  }

  if (typeof error !== "undefined") {
    response.error = error;
  }

  if (extra) {
    Object.assign(response, extra);
  }

  return response;
}
