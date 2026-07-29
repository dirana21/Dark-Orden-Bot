import { AuthError } from "@/domain/auth/errors";
import { D1PlayerBuildRepository } from "@/infrastructure/build/d1-player-build-repository";
import { authUseCases } from "../../auth/_shared/dependencies";
import {
  authErrorResponse,
  readSessionCookie,
} from "../../auth/_shared/http";

const loadouts = new D1PlayerBuildRepository();

export async function GET(request: Request) {
  try {
    const user = await authUseCases.getSession.execute(
      readSessionCookie(request),
    );
    if (!user) {
      throw new AuthError(
        "UNAUTHORIZED",
        "Войдите в аккаунт, чтобы смотреть билды игроков.",
      );
    }

    return Response.json(
      { authors: await loadouts.listCommunity(user.guildId) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return authErrorResponse(error);
  }
}
