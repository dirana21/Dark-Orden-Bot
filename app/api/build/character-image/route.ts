import { AuthError } from "@/domain/auth/errors";
import { D1BuildCharacterRepository } from "@/infrastructure/build/d1-build-character-repository";
import { getSkillIconsBucket } from "@/infrastructure/db/d1";
import { authUseCases } from "../../auth/_shared/dependencies";
import {
  authErrorResponse,
  readSessionCookie,
} from "../../auth/_shared/http";

const characters = new D1BuildCharacterRepository();

export async function GET(request: Request) {
  try {
    const user = await authUseCases.getSession.execute(
      readSessionCookie(request),
    );
    if (!user) {
      throw new AuthError(
        "UNAUTHORIZED",
        "Войдите в аккаунт, чтобы открыть изображение персонажа.",
      );
    }

    const id = new URL(request.url).searchParams.get("id")?.trim();
    const character = id
      ? await characters.get(user.guildId, id)
      : null;
    if (
      !character?.imageKey ||
      !character.imageContentType
    ) {
      return new Response("Not found", { status: 404 });
    }

    const object = await getSkillIconsBucket().get(character.imageKey);
    if (!object) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(object.body, {
      headers: {
        "Content-Type": character.imageContentType,
        "Cache-Control": "private, max-age=31536000, immutable",
        "Content-Length": String(object.size),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
