import { authUseCases } from "../../auth/_shared/dependencies";
import {
  authErrorResponse,
  readSessionCookie,
  validateMutationRequest,
} from "../../auth/_shared/http";
import { AuthError } from "@/domain/auth/errors";

export async function DELETE(request: Request) {
  const rejected = validateMutationRequest(request);
  if (rejected) {
    return rejected;
  }

  try {
    const sessionUser = await authUseCases.getSession.execute(
      readSessionCookie(request),
    );
    if (!sessionUser) {
      throw new AuthError(
        "UNAUTHORIZED",
        "Войдите в аккаунт, чтобы изменить подключение Discord.",
      );
    }

    const user = await authUseCases.disconnectDiscordProfile.execute(
      sessionUser.id,
    );
    return Response.json(
      { user },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return authErrorResponse(error);
  }
}
