import type { FormEvent } from "react";
import { useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { OnboardingShell } from "@/features/onboarding/components/OnboardingShell";
import { useObservedAction, useObservedMutation } from "@/lib/observed-convex";

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

          {auth.isAuthenticated ? (
            <p className="text-center text-sm">
              <Link
                className="font-medium text-foreground underline-offset-4 hover:underline"
                to="/settings/usage"
              >
                {t("confirmEmailChange.backToSettings")}
              </Link>
            </p>
          ) : null}
        </div>
      </OnboardingShell>
    </div>
  );
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
            /*
             * No sign-in and no create-account button.
             *
             * Both were still here, and both pointed at /login and /signup -- routes this
             * fork no longer has. So they were not merely against the rule that the user
             * never signs in to an embedded tool; they were two buttons that led nowhere.
             *
             * Reaching this branch at all means the automatic sign-in has not finished
             * (or has failed), which is a state to describe rather than a state to ask
             * the user to fix, because there is nothing here for them to do.
             */
            <p className="text-center text-sm text-muted-foreground">
              {t("acceptInvite.waitingForSession")}
            </p>
          )}

          {auth.isAuthenticated ? (
            <p className="text-center text-sm">
              <Link
                className="font-medium text-foreground underline-offset-4 hover:underline"
                to="/settings/team"
              >
                {t("acceptInvite.backToSettings")}
              </Link>
            </p>
          ) : null}
        </div>
      </OnboardingShell>
    </div>
  );
}
