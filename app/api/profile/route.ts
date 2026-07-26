import { authUseCases } from "../auth/_shared/dependencies";
import {
  authErrorResponse,
  readSessionCookie,
  validateMutationRequest,
} from "../auth/_shared/http";
import { AuthError } from "@/domain/auth/errors";

export async function PATCH(request: Request) {
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
        "Войдите в аккаунт, чтобы изменить профиль.",
      );
    }

    const input = (await request.json()) as {
      displayName?: string;
      realName?: string | null;
    };
    const user = await authUseCases.updateProfile.execute(sessionUser.id, {
      displayName: input.displayName ?? "",
      realName: input.realName,
    });

    return Response.json(
      { user },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return authErrorResponse(error);
  }
}
