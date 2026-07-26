import { authUseCases } from "../../../auth/_shared/dependencies";
import { readSessionCookie } from "../../../auth/_shared/http";
import {
  DISCORD_STATE_COOKIE,
  exchangeDiscordCode,
  expireStateCookie,
  getDiscordOAuthConfig,
  homeRedirect,
  readCookie,
  safeStateEquals,
} from "../_shared/oauth";

function finish(request: Request, result: string): Response {
  const response = homeRedirect(request, result);
  response.headers.append("Set-Cookie", expireStateCookie(request));
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.has("error")) {
    return finish(request, "cancelled");
  }

  const state = url.searchParams.get("state") ?? "";
  const expectedState = readCookie(request, DISCORD_STATE_COOKIE);
  const code = url.searchParams.get("code") ?? "";
  if (!code || !safeStateEquals(state, expectedState)) {
    return finish(request, "invalid_state");
  }

  const user = await authUseCases.getSession.execute(readSessionCookie(request));
  if (!user) {
    return finish(request, "login_required");
  }

  const config = getDiscordOAuthConfig(request);
  if (!config) {
    return finish(request, "unavailable");
  }

  try {
    const discord = await exchangeDiscordCode(config, code);
    await authUseCases.linkDiscordProfile.execute(user.id, {
      userId: discord.id,
      username: discord.username,
      displayName: (discord.global_name || discord.username).slice(0, 40),
      avatarHash: discord.avatar,
      connectedAt: Date.now(),
    });
    return finish(request, "connected");
  } catch (error) {
    console.error("discord.oauth.failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    });
    return finish(
      request,
      error instanceof Error && error.message.includes("уже привязан")
        ? "already_linked"
        : "failed",
    );
  }
}
