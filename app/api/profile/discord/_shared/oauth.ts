import { env } from "cloudflare:workers";

export const DISCORD_STATE_COOKIE = "dark_orden_discord_state";
export const DISCORD_CALLBACK_PATH = "/api/profile/discord/callback";

interface DiscordRuntimeEnv {
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  DISCORD_REDIRECT_URI?: string;
}

export interface DiscordOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface DiscordOAuthUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
}

export function getDiscordOAuthConfig(request: Request): DiscordOAuthConfig | null {
  const runtime = env as unknown as DiscordRuntimeEnv;
  const clientId = runtime.DISCORD_CLIENT_ID?.trim() ?? "";
  const clientSecret = runtime.DISCORD_CLIENT_SECRET?.trim() ?? "";

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri:
      runtime.DISCORD_REDIRECT_URI?.trim() ||
      new URL(DISCORD_CALLBACK_PATH, request.url).toString(),
  };
}

export function readCookie(request: Request, name: string): string {
  const prefix = `${name}=`;
  const value = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);

  return value ? decodeURIComponent(value) : "";
}

export function stateCookie(
  request: Request,
  value: string,
  maxAge = 600,
): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${DISCORD_STATE_COOKIE}=${encodeURIComponent(value)}; Path=${DISCORD_CALLBACK_PATH}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function expireStateCookie(request: Request): string {
  return stateCookie(request, "", 0);
}

export function safeStateEquals(left: string, right: string): boolean {
  if (!left || !right || left.length !== right.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function homeRedirect(request: Request, result: string): Response {
  const target = new URL("/", request.url);
  target.searchParams.set("discord", result);
  return new Response(null, {
    status: 303,
    headers: {
      Location: target.toString(),
      "Cache-Control": "no-store",
    },
  });
}

export async function exchangeDiscordCode(
  config: DiscordOAuthConfig,
  code: string,
): Promise<DiscordOAuthUser> {
  const tokenResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Discord token exchange failed (${tokenResponse.status}).`);
  }

  const token = (await tokenResponse.json()) as { access_token?: string };
  if (!token.access_token) {
    throw new Error("Discord did not return an access token.");
  }

  const profileResponse = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });

  if (!profileResponse.ok) {
    throw new Error(`Discord profile request failed (${profileResponse.status}).`);
  }

  const profile = (await profileResponse.json()) as Partial<DiscordOAuthUser>;
  if (
    typeof profile.id !== "string" ||
    typeof profile.username !== "string" ||
    (profile.global_name !== null && typeof profile.global_name !== "string") ||
    (profile.avatar !== null && typeof profile.avatar !== "string")
  ) {
    throw new Error("Discord returned an invalid profile.");
  }

  return {
    id: profile.id,
    username: profile.username,
    global_name: profile.global_name ?? null,
    avatar: profile.avatar ?? null,
  };
}
