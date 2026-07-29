import { AuthError } from "@/domain/auth/errors";
import { BuildError } from "@/domain/build/errors";
import { canManageBuildSkills } from "@/domain/build/permissions";
import {
  validateBuildSigilCategory,
  validateBuildSigilDescription,
  validateBuildSigilIcon,
  validateBuildSigilName,
} from "@/domain/build/sigil-validation";
import { D1BuildSigilRepository } from "@/infrastructure/build/d1-build-sigil-repository";
import { getSkillIconsBucket } from "@/infrastructure/db/d1";
import {
  CryptoIdGenerator,
  SystemClock,
} from "@/infrastructure/system/system-services";
import { authUseCases } from "../../auth/_shared/dependencies";
import {
  authErrorResponse,
  readSessionCookie,
  validateMutationRequest,
} from "../../auth/_shared/http";

const sigils = new D1BuildSigilRepository();
const ids = new CryptoIdGenerator();
const clock = new SystemClock();

function iconExtension(contentType: string): string {
  return contentType === "image/png"
    ? "png"
    : contentType === "image/webp"
      ? "webp"
      : "jpg";
}

async function requireSessionUser(request: Request) {
  const user = await authUseCases.getSession.execute(
    readSessionCookie(request),
  );
  if (!user) {
    throw new AuthError(
      "UNAUTHORIZED",
      "Войдите в аккаунт, чтобы открыть каталог сигилов.",
    );
  }
  return user;
}

function requireEditor(
  role: Parameters<typeof canManageBuildSkills>[0],
) {
  if (!canManageBuildSkills(role)) {
    throw new AuthError(
      "FORBIDDEN",
      "Добавлять и удалять сигилы могут администраторы и офицеры.",
    );
  }
}

function sigilErrorResponse(error: unknown): Response {
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
    return Response.json(
      { sigils: await sigils.list(user.guildId) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return sigilErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const rejected = validateMutationRequest(request, 2_500_000);
  if (rejected) {
    return rejected;
  }

  let uploadedKey: string | null = null;
  try {
    const user = await requireSessionUser(request);
    requireEditor(user.role);
    const form = await request.formData();
    const name = validateBuildSigilName(form.get("name"));
    const category = validateBuildSigilCategory(form.get("category"));
    const description = validateBuildSigilDescription(
      form.get("description"),
    );
    const icon = validateBuildSigilIcon(form.get("icon"));
    const id = ids.generate();
    uploadedKey = `guilds/${user.guildId}/build-sigils/${id}.${iconExtension(icon.type)}`;

    await getSkillIconsBucket().put(uploadedKey, icon.stream(), {
      httpMetadata: { contentType: icon.type },
      customMetadata: {
        guildId: user.guildId,
        createdByUserId: user.id,
      },
    });

    const sigil = await sigils.create({
      id,
      guildId: user.guildId,
      name,
      category,
      description,
      iconKey: uploadedKey,
      iconContentType: icon.type,
      createdByUserId: user.id,
      now: clock.now(),
    });

    return Response.json(
      { sigil },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (uploadedKey) {
      try {
        await getSkillIconsBucket().delete(uploadedKey);
      } catch {
        // Best-effort cleanup when metadata creation fails.
      }
    }
    return sigilErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const rejected = validateMutationRequest(request);
  if (rejected) {
    return rejected;
  }

  try {
    const user = await requireSessionUser(request);
    requireEditor(user.role);
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) {
      throw new BuildError("Не удалось определить сигил.");
    }

    const deleted = await sigils.delete(user.guildId, id);
    if (!deleted) {
      throw new BuildError("Сигил уже удалён или не найден.");
    }
    try {
      await getSkillIconsBucket().delete(deleted.iconKey);
    } catch {
      // The catalog entry is already gone; stale bytes are harmless.
    }

    return Response.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return sigilErrorResponse(error);
  }
}
