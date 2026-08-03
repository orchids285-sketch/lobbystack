import type { FormEvent } from "react";
import { useCallback, useRef, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { api } from "../../../../../convex/_generated/api";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Button } from "@/components/ui/button";
import { OnboardingShell } from "@/features/onboarding/components/OnboardingShell";
import { captureAnalyticsEvent } from "@/lib/analytics";
import { buildAuthPathWithReturnTo } from "@/lib/auth-return-to";
import { isValidEmailAddress, meetsSignupPasswordRequirements } from "@/lib/auth-validation";
import { useObservedAction, useObservedMutation } from "@/lib/observed-convex";

type AuthErrorFlow = "signIn" | "signUp" | "resetRequest" | "resetVerification";

const DEV_TURNSTILE_SITE_KEY = "0x4AAAAAADKUjCqHD6BIFbWo";

function capturePublicAuthEvent(name: "web.auth.login_succeeded" | "web.auth.signup_succeeded") {
  captureAnalyticsEvent(name);
}

function getAuthErrorMessage(
  error: unknown,
  flow: AuthErrorFlow,
  t: TFunction<"auth">,
): string {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Missing environment variable `SITE_URL`")) {
    return t("errors.passwordResetMissingSiteUrl");
  }

  if (flow === "signIn") {
    if (message.includes("InvalidSecret") || message.includes("Invalid credentials")) {
      return t("errors.incorrectCredentials");
    }
    return t("errors.incorrectCredentials");
  }

  if (flow === "signUp") {
    if (message.includes("already exists")) {
      return t("errors.accountExists");
    }

    if (message.includes("Invalid password")) {
      return t("errors.invalidPassword");
    }

    if (message.includes("Turnstile")) {
      return t("errors.turnstileFailed");
    }

    return t("errors.signupFailed");
  }

  if (flow === "resetVerification") {
    if (
      message.includes("Invalid code") ||
      message.includes("Could not verify code") ||
      message.includes("InvalidAccountId")
    ) {
      return t("errors.invalidResetCode");
    }

    if (message.includes("Invalid password")) {
      return t("errors.invalidPassword");
    }

    return t("errors.passwordResetFailed");
  }

  return t("errors.passwordResetRequestFailed");
}

function isResetRequestLookupError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  return message.includes("InvalidAccountId");
}




export function ConfirmEmailChangePage() {
  const { t } = useTranslation("auth");
  const auth = useConvexAuth();
  const confirmEmailChange = useObservedAction(api.businesses.catalog.confirmEmailChange);
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const token = searchParams.get("token")?.trim() ?? "";
  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const hasConfirmationParams = token.length > 0 && email.length > 0;
  const returnHref = auth.isAuthenticated ? "/settings/usage" : "/login";
  const returnLabel = auth.isAuthenticated
    ? t("confirmEmailChange.backToSettings")
    : t("confirmEmailChange.backToLogin");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    if (!hasConfirmationParams) {
      setErrorMessage(t("confirmEmailChange.invalidLink"));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await confirmEmailChange({
        code: token,
        email,
      });
      setStatusMessage(t("confirmEmailChange.success", { email: result.email }));
    } catch {
      setErrorMessage(t("confirmEmailChange.invalidLink"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const description = hasConfirmationParams
    ? t("confirmEmailChange.subtitle", { email })
    : t("confirmEmailChange.invalidLink");

  return (
    <div data-ph-no-capture>
      <OnboardingShell
        description={description}
        progress={null}
        title={t("confirmEmailChange.title")}
        width="sm"
      >
        <div className="flex flex-col gap-6">
          {statusMessage ? (
            <p className="text-center text-sm text-muted-foreground">{statusMessage}</p>
          ) : null}
          {errorMessage ? (
            <p className="text-center text-sm text-destructive">{errorMessage}</p>
          ) : null}

          <form className="flex flex-col" onSubmit={handleSubmit}>
            <Button
              className="h-11 w-full"
              disabled={!hasConfirmationParams || isSubmitting || statusMessage !== null}
              type="submit"
            >
              {isSubmitting
                ? t("confirmEmailChange.submitting")
                : t("confirmEmailChange.submit")}
            </Button>
          </form>

          <p className="text-center text-sm">
            <Link
              className="font-medium text-foreground underline-offset-4 hover:underline"
              to={returnHref}
            >
              {returnLabel}
            </Link>
          </p>
        </div>
      </OnboardingShell>
    </div>
  );
}

function buildAuthReturnPath(pathname: string, search: string): string {
  return `${pathname}${search}`;
}

export function AcceptInvitePage() {
  const { t } = useTranslation("auth");
  const auth = useConvexAuth();
  const navigate = useNavigate();
  const acceptInvitation = useObservedMutation(api.businesses.members.acceptInvitation);
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const token = searchParams.get("token")?.trim() ?? "";
  const hasToken = token.length > 0;
  const returnPath = buildAuthReturnPath(
    "/accept-invite",
    searchParams.toString() ? `?${searchParams.toString()}` : "",
  );
  const preview = useQuery(
    api.businesses.members.previewInvitation,
    hasToken ? { token } : "skip",
  );
  const isPreviewLoading = hasToken && preview === undefined;
  const isInvitationValid =
    preview &&
    preview.status === "pending" &&
    !preview.expired &&
    preview.businessName;
  const loginHref = `/login?returnTo=${encodeURIComponent(returnPath)}`;
  const signupHref = `/signup?returnTo=${encodeURIComponent(returnPath)}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!hasToken) {
      setErrorMessage(t("acceptInvite.invalidLink"));
      return;
    }

    if (!auth.isAuthenticated) {
      setErrorMessage(t("acceptInvite.signInRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      await acceptInvitation({ token });
      toast.success(
        t("acceptInvite.success", {
          businessName: preview?.businessName ?? t("acceptInvite.workspaceFallback"),
        }),
      );
      navigate("/settings/team", { replace: true });
    } catch {
      setErrorMessage(t("acceptInvite.failed"));
      setIsSubmitting(false);
    }
  }

  let description = t("acceptInvite.invalidLink");
  if (isPreviewLoading) {
    description = t("acceptInvite.loading");
  } else if (preview && preview.expired) {
    description = t("acceptInvite.expired");
  } else if (preview && preview.status !== "pending") {
    description = t("acceptInvite.invalidLink");
  } else if (isInvitationValid) {
    description = t("acceptInvite.subtitle", {
      businessName: preview.businessName,
      email: preview.email,
    });
  }

  return (
    <div data-ph-no-capture>
      <OnboardingShell
        description={description}
        progress={null}
        title={t("acceptInvite.title")}
        width="sm"
      >
        <div className="flex flex-col gap-6">
          {errorMessage ? (
            <p className="text-center text-sm text-destructive">{errorMessage}</p>
          ) : null}

          {auth.isAuthenticated ? (
            <form className="flex flex-col" onSubmit={handleSubmit}>
              <Button
                className="h-11 w-full"
                disabled={
                  !isInvitationValid ||
                  isSubmitting ||
                  isPreviewLoading
                }
                loading={isSubmitting}
                loadingLabel={t("acceptInvite.submitting")}
                type="submit"
              >
                {t("acceptInvite.submit")}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col gap-3">
              <Button
                className="h-11 w-full"
                disabled={!isInvitationValid || isPreviewLoading}
                render={<Link to={loginHref} />}
                type="button"
              >
                {t("acceptInvite.signIn")}
              </Button>
              <Button
                className="h-11 w-full"
                disabled={!isInvitationValid || isPreviewLoading}
                render={<Link to={signupHref} />}
                type="button"
                variant="outline"
              >
                {t("acceptInvite.createAccount")}
              </Button>
            </div>
          )}

          <p className="text-center text-sm">
            <Link
              className="font-medium text-foreground underline-offset-4 hover:underline"
              to={auth.isAuthenticated ? "/settings/team" : "/login"}
            >
              {auth.isAuthenticated
                ? t("acceptInvite.backToSettings")
                : t("acceptInvite.backToLogin")}
            </Link>
          </p>
        </div>
      </OnboardingShell>
    </div>
  );
}
