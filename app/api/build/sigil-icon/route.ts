import { AuthError } from "@/domain/auth/errors";
import { D1BuildSigilRepository } from "@/infrastructure/build/d1-build-sigil-repository";
import { getSkillIconsBucket } from "@/infrastructure/db/d1";
import { authUseCases } from "../../auth/_shared/dependencies";
import {
  authErrorResponse,
  readSessionCookie,
} from "../../auth/_shared/http";

const sigils = new D1BuildSigilRepository();

export async function GET(request: Request) {
  try {
    const user = await authUseCases.getSession.execute(
      readSessionCookie(request),
    );
    if (!user) {
      throw new AuthError(
        "UNAUTHORIZED",
        "Войдите в аккаунт, чтобы открыть иконку сигила.",
      );
    }

    const id = new URL(request.url).searchParams.get("id")?.trim();
    const sigil = id ? await sigils.get(user.guildId, id) : null;
    if (!sigil) {
      return new Response("Not found", { status: 404 });
    }

    const object = await getSkillIconsBucket().get(sigil.iconKey);
    if (!object) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(object.body, {
      headers: {
        "Content-Type": sigil.iconContentType,
        "Cache-Control": "private, max-age=3600",
        "Content-Length": String(object.size),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
