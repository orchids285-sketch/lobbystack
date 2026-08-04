/**
 * What survives of the marketing-site linking.
 *
 * This module used to build absolute links into the vendor's marketing site -- pricing,
 * blog posts, the affiliate programme -- defaulting to their domain whenever no
 * environment variable was set, which is the state this deployment is in. None of it was
 * reachable any more: once the marketing surfaces were removed the functions lost their
 * callers, and the only thing any component still imports from here is the locale type.
 *
 * Keeping the rest would have kept a vendor domain and a table of their blog URLs in the
 * bundle, serving a feature nothing can invoke.
 */
export type MarketingLocale = "en" | "fr";
