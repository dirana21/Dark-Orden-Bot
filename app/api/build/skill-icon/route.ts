import { AuthError } from "@/domain/auth/errors";
import { D1BuildSkillRepository } from "@/infrastructure/build/d1-build-skill-repository";
import { getSkillIconsBucket } from "@/infrastructure/db/d1";
import { authUseCases } from "../../auth/_shared/dependencies";
import {
  authErrorResponse,
  readSessionCookie,
} from "../../auth/_shared/http";

const skills = new D1BuildSkillRepository();

export async function GET(request: Request) {
  try {
    const user = await authUseCases.getSession.execute(
      readSessionCookie(request),
    );
    if (!user) {
      throw new AuthError(
        "UNAUTHORIZED",
        "Войдите в аккаунт, чтобы открыть иконку умения.",
      );
    }

    const id = new URL(request.url).searchParams.get("id")?.trim();
    const skill = id ? await skills.get(user.guildId, id) : null;
    if (!skill) {
      return new Response("Not found", { status: 404 });
    }

    const object = await getSkillIconsBucket().get(skill.iconKey);
    if (!object) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(object.body, {
      headers: {
        "Content-Type": skill.iconContentType,
        "Cache-Control": "private, max-age=3600",
        "Content-Length": String(object.size),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
