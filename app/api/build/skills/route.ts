import { AuthError } from "@/domain/auth/errors";
import { BuildError } from "@/domain/build/errors";
import { canManageBuildSkills } from "@/domain/build/permissions";
import {
  sanitizeBuildSkillDescription,
  validateBuildCharacter,
  validateBuildSkillIcon,
  validateBuildSkillName,
} from "@/domain/build/validation";
import { D1BuildSkillRepository } from "@/infrastructure/build/d1-build-skill-repository";
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

const skills = new D1BuildSkillRepository();
const ids = new CryptoIdGenerator();
const clock = new SystemClock();

async function requireSessionUser(request: Request) {
  const user = await authUseCases.getSession.execute(readSessionCookie(request));
  if (!user) {
    throw new AuthError(
      "UNAUTHORIZED",
      "Войдите в аккаунт, чтобы открыть умения.",
    );
  }
  return user;
}

function requireAdmin(role: Parameters<typeof canManageBuildSkills>[0]) {
  if (!canManageBuildSkills(role)) {
    throw new AuthError(
      "FORBIDDEN",
      "Добавлять и удалять общие умения могут только администраторы.",
    );
  }
}

function skillErrorResponse(error: unknown): Response {
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
    const character = validateBuildCharacter(
      new URL(request.url).searchParams.get("character"),
    );
    return Response.json(
      { skills: await skills.list(user.guildId, character) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return skillErrorResponse(error);
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
    requireAdmin(user.role);

    const form = await request.formData();
    const character = validateBuildCharacter(form.get("character"));
    const name = validateBuildSkillName(form.get("name"));
    const descriptionHtml = sanitizeBuildSkillDescription(
      form.get("descriptionHtml"),
    );
    const icon = validateBuildSkillIcon(form.get("icon"));
    const id = ids.generate();
    const extension =
      icon.type === "image/png"
        ? "png"
        : icon.type === "image/webp"
          ? "webp"
          : "jpg";
    uploadedKey = `guilds/${user.guildId}/build-skills/${id}.${extension}`;

    await getSkillIconsBucket().put(uploadedKey, icon.stream(), {
      httpMetadata: { contentType: icon.type },
      customMetadata: {
        guildId: user.guildId,
        createdByUserId: user.id,
      },
    });

    const skill = await skills.create({
      id,
      guildId: user.guildId,
      character,
      name,
      descriptionHtml,
      iconKey: uploadedKey,
      iconContentType: icon.type,
      createdByUserId: user.id,
      now: clock.now(),
    });

    return Response.json(
      { skill },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (uploadedKey) {
      try {
        await getSkillIconsBucket().delete(uploadedKey);
      } catch {
        // The metadata write did not complete; best-effort cleanup only.
      }
    }
    return skillErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const rejected = validateMutationRequest(request);
  if (rejected) {
    return rejected;
  }

  try {
    const user = await requireSessionUser(request);
    requireAdmin(user.role);
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) {
      throw new BuildError("Не удалось определить умение.");
    }

    const deleted = await skills.delete(user.guildId, id);
    if (!deleted) {
      throw new BuildError("Умение уже удалено или не найдено.");
    }
    try {
      await getSkillIconsBucket().delete(deleted.iconKey);
    } catch {
      // The skill is already removed from the catalog; stale bytes are harmless.
    }

    return Response.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return skillErrorResponse(error);
  }
}
