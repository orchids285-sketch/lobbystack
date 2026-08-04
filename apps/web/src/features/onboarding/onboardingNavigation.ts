const onboardingStageSteps: Record<string, number> = {
  create_business: 2,
  website: 3,
  knowledge: 4,
  greeting: 5,
  verify_phone: 6,
  verify_phone_code: 7,
  plan: 8,
  phone_number: 9,
  phone_number_claiming: 9,
  attribution: 10,
  completed: 11,
};

type OnboardingBillingPlan =
  | "free_cloud"
  | "self_host"
  | "starter"
  | "pro"
  | "enterprise";

export function onboardingStageNeedsBillingPlan(stage: string | undefined): boolean {
  return stage === "phone_number" || stage === "phone_number_claiming";
}

export function getOnboardingRouteForStage(
  stage: string | undefined,
  billingPlan?: OnboardingBillingPlan,
): string | null {
  // The plan step is skipped rather than removed.
  //
  // It sat at step 8 of eleven and asked the user to pick a paid plan for a tool the host
  // already charges them for. Deleting the route would have stranded anyone whose saved
  // stage points at it, so every path that led to the price list now leads to the step
  // after it and the funnel still completes.

  switch (stage) {
    case "create_business":
      return "/onboarding/business";
    case "website":
      return "/onboarding/website";
    case "knowledge":
      return "/onboarding/knowledge";
    case "greeting":
      return "/onboarding/greeting";
    case "verify_phone":
      return "/onboarding/verify-phone";
    case "verify_phone_code":
      return "/onboarding/verify-phone/code";
    case "phone_number":
    case "phone_number_claiming":
      return "/onboarding/number";
    case "plan":
      return "/onboarding/number";
    case "attribution":
      return "/onboarding/attribution";
    default:
      return null;
  }
}

export function canVisitOnboardingStage(
  currentStage: string | undefined,
  targetStage: string,
): boolean {
  const currentStep = currentStage ? onboardingStageSteps[currentStage] : undefined;
  const targetStep = onboardingStageSteps[targetStage];

  return currentStep !== undefined && targetStep !== undefined && targetStep <= currentStep;
}

export function onboardingNavigableStep(stage: string | undefined): number {
  return stage ? (onboardingStageSteps[stage] ?? 1) : 1;
}

export function getPhoneVerificationApprovedRedirect(
  _onboardingStage: string | undefined,
): "/onboarding/number" {
  // Both branches used to differ only in whether the user was sent to the price list.
  return "/onboarding/number";
}
