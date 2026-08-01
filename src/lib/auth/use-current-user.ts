import { useEffect, useState } from "react";
import { authClient, authEnabled } from "./client";
import { getLocalSession, type LocalUser } from "./local-session";

/** Normalized user shape used across the app, auth on or off. */
export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  /** True when this is the sandbox/dev fallback (auth not configured). */
  isDevFallback: boolean;
  /** True when signed in via device-local account (not Better Auth cookie). */
  isLocal?: boolean;
};

export const DEV_USER: AppUser = {
  id: "dev-user",
  displayName: "Dev User",
  primaryEmail: "dev@example.com",
  profileImageUrl: null,
  isDevFallback: true,
};

export type CurrentUserState = {
  user: AppUser | null;
  isPending: boolean;
};

function fromLocal(u: LocalUser): AppUser {
  return {
    id: u.id,
    displayName: u.name,
    primaryEmail: u.email,
    profileImageUrl: null,
    isDevFallback: false,
    isLocal: true,
  };
}

/**
 * Current user + loading. Prefers Better Auth session; falls back to
 * device-local email session so login still works when cookies/OAuth fail.
 */
export function useCurrentUserState(): CurrentUserState {
  if (!authEnabled) return { user: DEV_USER, isPending: false };

  // eslint-disable-next-line react-hooks/rules-of-hooks -- authEnabled is constant for the app's lifetime
  const { data, isPending } = authClient.useSession();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [localUser, setLocalUser] = useState<LocalUser | null>(() =>
    typeof window !== "undefined" ? getLocalSession() : null,
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const sync = () => setLocalUser(getLocalSession());
    sync();
    window.addEventListener("fash-local-auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("fash-local-auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const remote = data?.user;
  if (remote) {
    return {
      user: {
        id: remote.id,
        displayName: remote.name ?? null,
        primaryEmail: remote.email ?? null,
        profileImageUrl: remote.image ?? null,
        isDevFallback: false,
        isLocal: false,
      },
      isPending: false,
    };
  }

  if (localUser) {
    return { user: fromLocal(localUser), isPending: false };
  }

  return { user: null, isPending };
}

export function useCurrentUser(): AppUser | null {
  return useCurrentUserState().user;
}
