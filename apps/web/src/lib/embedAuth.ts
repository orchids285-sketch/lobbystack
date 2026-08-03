/**
 * Signing in without a sign-in screen.
 *
 * This build runs inside a product the user is already signed into, so it must never ask
 * them to make a second account. But Convex Auth is not optional plumbing here: every
 * query and mutation resolves an identity, and a business, and the data belonging to it.
 * Removing authentication would not make the app open, it would make it empty.
 *
 * So the session is made invisible rather than removed. The iframe URL carries the host's
 * user id and a signed ticket; the host mints credentials for that id and this signs in
 * with them. The user sees a loading state and then their own workspace.
 *
 * Why credentials reach the browser at all: Convex Auth completes the sign-in client-side,
 * so there is no server-side handoff to borrow. What makes it safe is that they are
 * useless to anyone else -- derived per user, only for this tool, and only obtainable by
 * presenting a ticket the host signed for that same user. Without the ticket the endpoint
 * refuses, which is what stops ?fr_user=<someone-else> from being an account takeover.
 */

const HOST_BACKEND =
  (import.meta.env.VITE_FR_BACKEND as string | undefined)?.replace(/\/$/, "") ?? "";

export type EmbedIdentity = { frUser: string; ticket: string };

/** The host's identity for this frame, or null when opened directly rather than embedded. */
export function readEmbedIdentity(): EmbedIdentity | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search);
  const frUser = (q.get("fr_user") ?? "").trim();
  const ticket = (q.get("t") ?? "").trim();
  // "shared" and "anon" identify nobody, so there is no workspace to open and nothing to
  // protect. Treated as not embedded rather than as a user.
  if (!frUser || frUser === "shared" || frUser === "anon") return null;
  return { frUser, ticket };
}

export function isEmbedded(): boolean {
  return readEmbedIdentity() !== null;
}

type Credentials = { email: string; password: string };

/** Ask the host for this user's derived credentials. Null whenever it declines. */
export async function fetchEmbedCredentials(
  identity: EmbedIdentity,
): Promise<Credentials | null> {
  if (!HOST_BACKEND) return null;
  try {
    const url =
      `${HOST_BACKEND}/api/lobbystack/user-session` +
      `?fr_user=${encodeURIComponent(identity.frUser)}` +
      (identity.ticket ? `&t=${encodeURIComponent(identity.ticket)}` : "");
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      ok?: boolean;
      email?: string;
      password?: string;
    };
    if (!body?.ok || !body.email || !body.password) return null;
    return { email: body.email, password: body.password };
  } catch {
    // An unreachable host is a signed-out frame, not a crash.
    return null;
  }
}

/** Exactly what we pass, no wider: a looser type here would make Convex's own signIn
 *  fail to match, since a callback may accept more than it is asked to, never less. */

/**
 * Sign in, creating the account on first visit.
 *
 * signIn is tried first because it is the common path: the account exists on every visit
 * after the first. Only when it fails do we pay for signUp -- and a signUp that fails
 * because the account already exists means the password no longer matches, which no
 * amount of retrying here can fix, so it gives up rather than looping.
 */
type SignInFn = (
  provider: string,
  params: { email: string; password: string; flow: string },
) => Promise<unknown>;

export async function signInWithEmbedCredentials(
  signIn: SignInFn,
  credentials: Credentials,
): Promise<boolean> {
  const base = { email: credentials.email, password: credentials.password };
  try {
    await signIn("password", { ...base, flow: "signIn" });
    return true;
  } catch {
    try {
      await signIn("password", { ...base, flow: "signUp" });
      return true;
    } catch {
      return false;
    }
  }
}
