/**
 * Device-local email/password session for Fash Studio.
 * Works when Better Auth cookies/OAuth fail (preview iframe, custom domain,
 * DB reset after deploy). Users stored in localStorage — per-browser only.
 */

export type LocalUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

type StoredUser = LocalUser & { passHash: string };

const USERS_KEY = "fash-local-users-v1";
const SESSION_KEY = "fash-local-session-v1";

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`fash-v1:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function uid() {
  return `local_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function getLocalSession(): LocalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalUser;
  } catch {
    return null;
  }
}

export function setLocalSession(user: LocalUser | null) {
  if (typeof window === "undefined") return;
  if (!user) sessionStorage.removeItem(SESSION_KEY);
  else sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  // Notify same-tab listeners
  window.dispatchEvent(new Event("fash-local-auth"));
}

export async function localRegister(input: {
  email: string;
  password: string;
  name: string;
}): Promise<LocalUser> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("Email không hợp lệ");
  if (input.password.length < 8) throw new Error("Mật khẩu tối thiểu 8 ký tự");
  const users = readUsers();
  if (users.some((u) => u.email === email)) {
    throw new Error("Email đã được đăng ký trên thiết bị này — hãy đăng nhập");
  }
  const user: StoredUser = {
    id: uid(),
    email,
    name: input.name.trim() || "Chủ shop",
    createdAt: new Date().toISOString(),
    passHash: await hashPassword(input.password),
  };
  users.push(user);
  writeUsers(users);
  const pub: LocalUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
  setLocalSession(pub);
  return pub;
}

export async function localLogin(input: {
  email: string;
  password: string;
}): Promise<LocalUser> {
  const email = input.email.trim().toLowerCase();
  const users = readUsers();
  const found = users.find((u) => u.email === email);
  if (!found) {
    throw new Error(
      "Chưa có tài khoản trên thiết bị này. Bấm Đăng ký gian hàng trước (hoặc DB server đã reset sau deploy).",
    );
  }
  const hash = await hashPassword(input.password);
  if (hash !== found.passHash) {
    throw new Error("Mật khẩu không đúng");
  }
  const pub: LocalUser = {
    id: found.id,
    email: found.email,
    name: found.name,
    createdAt: found.createdAt,
  };
  setLocalSession(pub);
  return pub;
}

export function localLogout() {
  setLocalSession(null);
}

/** Try Better Auth then fall back to local device accounts. */
export async function loginEmailHybrid(opts: {
  email: string;
  password: string;
  betterAuthSignIn?: (args: {
    email: string;
    password: string;
  }) => Promise<{
    data?: {
      token?: string | null;
      user?: {
        id: string;
        name?: string | null;
        email?: string | null;
      } | null;
    } | null;
    error?: { message?: string } | null;
  }>;
  persistToken?: (token: string) => void;
}): Promise<{ source: "server" | "local"; user: LocalUser }> {
  const email = opts.email.trim().toLowerCase();
  if (opts.betterAuthSignIn) {
    try {
      const { data, error } = await opts.betterAuthSignIn({
        email,
        password: opts.password,
      });
      if (!error && data?.user) {
        if (data.token && opts.persistToken) opts.persistToken(data.token);
        const user: LocalUser = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.name || "User",
          createdAt: new Date().toISOString(),
        };
        setLocalSession(user);
        return { source: "server", user };
      }
    } catch {
      /* fall through */
    }
  }
  const user = await localLogin({ email, password: opts.password });
  return { source: "local", user };
}

export async function registerEmailHybrid(opts: {
  email: string;
  password: string;
  name: string;
  betterAuthSignUp?: (args: {
    email: string;
    password: string;
    name: string;
  }) => Promise<{
    data?: {
      token?: string | null;
      user?: {
        id: string;
        name?: string | null;
        email?: string | null;
      } | null;
    } | null;
    error?: { message?: string } | null;
  }>;
  persistToken?: (token: string) => void;
}): Promise<{ source: "server" | "local"; user: LocalUser }> {
  const email = opts.email.trim().toLowerCase();
  const name = opts.name.trim() || "Chủ shop";

  let localUser: LocalUser;
  try {
    localUser = await localRegister({ email, password: opts.password, name });
  } catch (e) {
    if ((e as Error).message.includes("đã được đăng ký")) {
      localUser = await localLogin({ email, password: opts.password });
    } else throw e;
  }

  if (opts.betterAuthSignUp) {
    try {
      const { data, error } = await opts.betterAuthSignUp({
        email,
        password: opts.password,
        name,
      });
      if (!error && data?.user) {
        if (data.token && opts.persistToken) opts.persistToken(data.token);
        const user: LocalUser = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.name || name,
          createdAt: localUser.createdAt,
        };
        setLocalSession(user);
        return { source: "server", user };
      }
    } catch {
      /* keep local */
    }
  }
  return { source: "local", user: localUser };
}
