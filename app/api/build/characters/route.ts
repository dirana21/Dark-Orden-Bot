import { AuthError } from "@/domain/auth/errors";
import { BuildError } from "@/domain/build/errors";
import { canManageBuildSkills } from "@/domain/build/permissions";
import {
  validateBuildCharacter,
  validateBuildCharacterImage,
} from "@/domain/build/validation";
import { D1BuildCharacterRepository } from "@/infrastructure/build/d1-build-character-repository";
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

const characters = new D1BuildCharacterRepository();
const ids = new CryptoIdGenerator();
const clock = new SystemClock();

function imageExtension(contentType: string): string {
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
      "Войдите в аккаунт, чтобы открыть каталог персонажей.",
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
      "Добавлять персонажей и менять их изображения могут администраторы и офицеры.",
    );
  }
}

function characterErrorResponse(error: unknown): Response {
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
      { characters: await characters.list(user.guildId) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return characterErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const rejected = validateMutationRequest(request, 9_000_000);
  if (rejected) {
    return rejected;
  }

  let uploadedKey: string | null = null;
  try {
    const user = await requireSessionUser(request);
    requireEditor(user.role);
    const form = await request.formData();
    const name = validateBuildCharacter(form.get("name"));
    if (await characters.findByName(user.guildId, name)) {
      throw new BuildError("Персонаж с таким названием уже существует.");
    }

    const image = validateBuildCharacterImage(
      form.get("image"),
      false,
    );
    const id = ids.generate();
    if (image) {
      uploadedKey = `guilds/${user.guildId}/build-characters/${id}.${imageExtension(image.type)}`;
      await getSkillIconsBucket().put(uploadedKey, image.stream(), {
        httpMetadata: { contentType: image.type },
        customMetadata: {
          guildId: user.guildId,
          createdByUserId: user.id,
        },
      });
    }

    const character = await characters.create({
      id,
      guildId: user.guildId,
      name,
      imageKey: uploadedKey,
      imageContentType: image?.type ?? null,
      createdByUserId: user.id,
      now: clock.now(),
    });
    return Response.json(
      { character },
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
    return characterErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const rejected = validateMutationRequest(request, 9_000_000);
  if (rejected) {
    return rejected;
  }

  let uploadedKey: string | null = null;
  let updateCommitted = false;
  try {
    const user = await requireSessionUser(request);
    requireEditor(user.role);
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) {
      throw new BuildError("Не удалось определить персонажа.");
    }
    const current = await characters.get(user.guildId, id);
    if (!current) {
      throw new BuildError("Персонаж не найден.");
    }

    const form = await request.formData();
    const image = validateBuildCharacterImage(form.get("image"));
    if (!image) {
      throw new BuildError("Добавьте изображение персонажа.");
    }
    uploadedKey = `guilds/${user.guildId}/build-characters/${id}-${ids.generate()}.${imageExtension(image.type)}`;
    await getSkillIconsBucket().put(uploadedKey, image.stream(), {
      httpMetadata: { contentType: image.type },
      customMetadata: {
        guildId: user.guildId,
        createdByUserId: user.id,
      },
    });

    const character = await characters.updateImage({
      guildId: user.guildId,
      id,
      imageKey: uploadedKey,
      imageContentType: image.type,
      now: clock.now(),
    });
    if (!character) {
      throw new BuildError("Персонаж не найден.");
    }
    updateCommitted = true;

    if (current.imageKey && current.imageKey !== uploadedKey) {
      try {
        await getSkillIconsBucket().delete(current.imageKey);
      } catch {
        // The new image is active; stale bytes can be cleaned up later.
      }
    }

    return Response.json(
      { character },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (uploadedKey && !updateCommitted) {
      try {
        await getSkillIconsBucket().delete(uploadedKey);
      } catch {
        // Best-effort cleanup when metadata update fails.
      }
    }
    return characterErrorResponse(error);
  }
}
