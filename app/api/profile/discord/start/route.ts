import { authUseCases } from "../../../auth/_shared/dependencies";
import { readSessionCookie } from "../../../auth/_shared/http";
import {
  getDiscordOAuthConfig,
  homeRedirect,
  stateCookie,
} from "../_shared/oauth";

export async function GET(request: Request) {
  const user = await authUseCases.getSession.execute(readSessionCookie(request));
  if (!user) {
    return homeRedirect(request, "login_required");
  }

  const config = getDiscordOAuthConfig(request);
  if (!config) {
    return homeRedirect(request, "unavailable");
  }

  const state = crypto.randomUUID().replaceAll("-", "");
  const authorizationUrl = new URL("https://discord.com/oauth2/authorize");
  authorizationUrl.searchParams.set("client_id", config.clientId);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("redirect_uri", config.redirectUri);
  authorizationUrl.searchParams.set("scope", "identify");
  authorizationUrl.searchParams.set("state", state);

  const response = new Response(null, {
    status: 302,
    headers: { Location: authorizationUrl.toString() },
  });
  response.headers.append("Set-Cookie", stateCookie(request, state));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
