import { blackSunUseCases } from "./_shared/dependencies";
import { authUseCases } from "../auth/_shared/dependencies";
import {
  authErrorResponse,
  readSessionCookie,
  validateMutationRequest,
} from "../auth/_shared/http";
import { AuthError } from "@/domain/auth/errors";
import { validateEventSession } from "@/domain/events/validation";

async function requireSessionUser(request: Request) {
  const user = await authUseCases.getSession.execute(readSessionCookie(request));
  if (!user) {
    throw new AuthError(
      "UNAUTHORIZED",
      "Войдите в аккаунт, чтобы открыть рейтинг Чёрного Солнца.",
    );
  }
  return user;
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser(request);
    const sessionNumber = validateEventSession(
      new URL(request.url).searchParams.get("session"),
    );
    const standings = await blackSunUseCases.list.execute(
      user.guildId,
      user.id,
      sessionNumber,
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
    const sessionNumber = validateEventSession(
      new URL(request.url).searchParams.get("session"),
    );
    const input = (await request.json()) as { points?: unknown };
    await blackSunUseCases.submit.execute(
      user.id,
      user.guildId,
      sessionNumber,
      input.points,
    );
    const standings = await blackSunUseCases.list.execute(
      user.guildId,
      user.id,
      sessionNumber,
    );
    return Response.json(
      { standings },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const rejected = validateMutationRequest(request);
  if (rejected) {
    return rejected;
  }

  try {
    const user = await requireSessionUser(request);
    const sessionNumber = validateEventSession(
      new URL(request.url).searchParams.get("session"),
    );
    const input = (await request.json()) as { role?: unknown };
    await blackSunUseCases.selectRole.execute(
      user.id,
      user.guildId,
      sessionNumber,
      input.role,
    );
    const standings = await blackSunUseCases.list.execute(
      user.guildId,
      user.id,
      sessionNumber,
    );
    return Response.json(
      { standings },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return authErrorResponse(error);
  }
}
