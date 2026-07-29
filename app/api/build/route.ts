import { AuthError } from "@/domain/auth/errors";
import { BuildError } from "@/domain/build/errors";
import {
  validateBuildCharacter,
  validateBuildCharacterSlot,
} from "@/domain/build/validation";
import { D1BuildRepository } from "@/infrastructure/build/d1-build-repository";
import { SystemClock } from "@/infrastructure/system/system-services";
import { authUseCases } from "../auth/_shared/dependencies";
import {
  authErrorResponse,
  readSessionCookie,
  validateMutationRequest,
} from "../auth/_shared/http";

const builds = new D1BuildRepository();
const clock = new SystemClock();

async function requireSessionUser(request: Request) {
  const user = await authUseCases.getSession.execute(readSessionCookie(request));
  if (!user) {
    throw new AuthError(
      "UNAUTHORIZED",
      "Войдите в аккаунт, чтобы открыть билд.",
    );
  }
  return user;
}

function buildErrorResponse(error: unknown): Response {
  if (error instanceof BuildError) {
    return Response.json(
      { error: error.message },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  return authErrorResponse(error);
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser(request);
    const profile = await builds.get(user.id);
    return Response.json(
      { profile },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return buildErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const rejected = validateMutationRequest(request);
  if (rejected) {
    return rejected;
  }

  try {
    const user = await requireSessionUser(request);
    const input = (await request.json()) as {
      slot?: unknown;
      character?: unknown;
    };
    const profile = await builds.setCharacter(
      user.id,
      validateBuildCharacterSlot(input.slot),
      validateBuildCharacter(input.character),
      clock.now(),
    );
    return Response.json(
      { profile },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return buildErrorResponse(error);
  }
}
