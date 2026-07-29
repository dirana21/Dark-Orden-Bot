import { AuthError } from "@/domain/auth/errors";
import { BuildError } from "@/domain/build/errors";
import { validateBuildSkillComboEnabled } from "@/domain/build/validation";
import { D1BuildSkillRepository } from "@/infrastructure/build/d1-build-skill-repository";
import { SystemClock } from "@/infrastructure/system/system-services";
import { authUseCases } from "../../auth/_shared/dependencies";
import {
  authErrorResponse,
  readSessionCookie,
  validateMutationRequest,
} from "../../auth/_shared/http";

const skills = new D1BuildSkillRepository();
const clock = new SystemClock();

function comboErrorResponse(error: unknown): Response {
  if (error instanceof BuildError) {
    return Response.json(
      { error: error.message },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  return authErrorResponse(error);
}

export async function PATCH(request: Request) {
  const rejected = validateMutationRequest(request);
  if (rejected) {
    return rejected;
  }

  try {
    const user = await authUseCases.getSession.execute(
      readSessionCookie(request),
    );
    if (!user) {
      throw new AuthError(
        "UNAUTHORIZED",
        "Войдите в аккаунт, чтобы настроить комбо.",
      );
    }

    const input = (await request.json()) as {
      skillId?: unknown;
      enabled?: unknown;
    };
    const skillId =
      typeof input.skillId === "string" ? input.skillId.trim() : "";
    if (!skillId) {
      throw new BuildError("Не удалось определить умение.");
    }

    const skill = await skills.setCombo(
      user.guildId,
      user.id,
      skillId,
      validateBuildSkillComboEnabled(input.enabled),
      clock.now(),
    );
    if (!skill) {
      throw new BuildError("Для этого умения комбо недоступно.");
    }

    return Response.json(
      { skill },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return comboErrorResponse(error);
  }
}
