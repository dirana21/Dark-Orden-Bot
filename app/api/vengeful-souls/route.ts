import { AuthError } from "@/domain/auth/errors";
import { authUseCases } from "../auth/_shared/dependencies";
import {
  authErrorResponse,
  readSessionCookie,
  validateMutationRequest,
} from "../auth/_shared/http";
import { vengefulSoulsUseCases } from "./_shared/dependencies";

async function requireSessionUser(request: Request) {
  const user = await authUseCases.getSession.execute(readSessionCookie(request));
  if (!user) {
    throw new AuthError(
      "UNAUTHORIZED",
      "Войдите в аккаунт, чтобы открыть рейтинг Ночи неупокоеных душ.",
    );
  }
  return user;
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser(request);
    const standings = await vengefulSoulsUseCases.list.execute(
      user.guildId,
      user.id,
    );
    return Response.json(
      { standings },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const rejected = validateMutationRequest(request);
  if (rejected) {
    return rejected;
  }

  try {
    const user = await requireSessionUser(request);
    const input = (await request.json()) as { points?: unknown };
    await vengefulSoulsUseCases.submit.execute(
      user.id,
      user.guildId,
      input.points,
    );
    const standings = await vengefulSoulsUseCases.list.execute(
      user.guildId,
      user.id,
    );
    return Response.json(
      { standings },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return authErrorResponse(error);
  }
}
