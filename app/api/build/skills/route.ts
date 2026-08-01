import { AuthError } from "@/domain/auth/errors";
import { BuildError } from "@/domain/build/errors";
import { canManageBuildSkills } from "@/domain/build/permissions";
import { normalizeBuildSkillConfigurableSocketTypes } from "@/domain/build/model";
import {
  sanitizeBuildSkillDescription,
  validateBuildCharacter,
  validateBuildSkillComboAvailable,
  validateBuildSkillIcon,
  validateBuildSkillSocketTypes,
  validateBuildSkillSlotIndex,
  validateBuildSkillSlotType,
  validateBuildSkillName,
} from "@/domain/build/validation";
import { D1BuildSkillRepository } from "@/infrastructure/build/d1-build-skill-repository";
import { D1BuildSkillSlotIconRepository } from "@/infrastructure/build/d1-build-skill-slot-icon-repository";
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

const skills = new D1BuildSkillRepository();
const slotIcons = new D1BuildSkillSlotIconRepository();
const characters = new D1BuildCharacterRepository();
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
    if (!await characters.findByName(user.guildId, character)) {
      throw new BuildError("Персонаж не найден в каталоге.");
    }
    return Response.json(
      { skills: await skills.list(user.guildId, user.id, character) },
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
  let alternateUploadedKey: string | null = null;
  try {
    const user = await requireSessionUser(request);
    requireAdmin(user.role);

    const form = await request.formData();
    const character = validateBuildCharacter(form.get("character"));
    if (!await characters.findByName(user.guildId, character)) {
      throw new BuildError("Персонаж не найден в каталоге.");
    }
    const slotType = validateBuildSkillSlotType(form.get("slotType"));
    const slotIndex = validateBuildSkillSlotIndex(
      slotType,
      form.get("slotIndex"),
    );
    const socketTypes = normalizeBuildSkillConfigurableSocketTypes(
      slotType,
      slotIndex,
      validateBuildSkillSocketTypes(form.get("socketTypes")),
    );
    if (
      await skills.getBySlot(
        user.guildId,
        character,
        slotType,
        slotIndex,
      )
    ) {
      throw new BuildError("Этот слот уже занят другим умением.");
    }
    const name = validateBuildSkillName(form.get("name"));
    const descriptionHtml = sanitizeBuildSkillDescription(
      form.get("descriptionHtml"),
    );
    const hasAlternate = character === "Сераф";
    const alternateName = hasAlternate
      ? validateBuildSkillName(form.get("alternateName"))
      : undefined;
    const alternateDescriptionHtml = hasAlternate
      ? sanitizeBuildSkillDescription(form.get("alternateDescriptionHtml"))
      : undefined;
    const comboAvailable = validateBuildSkillComboAvailable(
      form.get("comboAvailable"),
    );
    const iconEntry = form.get("icon");
    const icon = iconEntry instanceof File && iconEntry.size > 0
      ? validateBuildSkillIcon(iconEntry)
      : null;
    const stagedIcon = await slotIcons.get(
      user.guildId,
      character,
      slotType,
      slotIndex,
    );
    if (!icon && !stagedIcon) {
      throw new BuildError("Добавьте иконку умения.");
    }
    const alternateIconEntry = form.get("alternateIcon");
    const alternateIcon = alternateIconEntry instanceof File && alternateIconEntry.size > 0
      ? validateBuildSkillIcon(alternateIconEntry)
      : null;
    if (hasAlternate && !alternateIcon && !stagedIcon?.alternateIconKey) {
      throw new BuildError("Добавьте иконку второй стойки Серафа.");
    }
    const id = ids.generate();
    if (icon) {
      const extension = iconExtension(icon.type);
      uploadedKey = `guilds/${user.guildId}/build-skills/${id}.${extension}`;
      await getSkillIconsBucket().put(uploadedKey, icon.stream(), {
        httpMetadata: { contentType: icon.type },
        customMetadata: { guildId: user.guildId, createdByUserId: user.id },
      });
    }
    if (alternateIcon) {
      alternateUploadedKey = `guilds/${user.guildId}/build-skills/${id}-alternate.${iconExtension(alternateIcon.type)}`;
      await getSkillIconsBucket().put(alternateUploadedKey, alternateIcon.stream(), {
        httpMetadata: { contentType: alternateIcon.type },
        customMetadata: { guildId: user.guildId, createdByUserId: user.id },
      });
    }

    const skill = await skills.create({
      id,
      guildId: user.guildId,
      character,
      slotType,
      slotIndex,
      socketTypes,
      name,
      descriptionHtml,
      iconKey: uploadedKey ?? stagedIcon!.iconKey,
      iconContentType: icon?.type ?? stagedIcon!.iconContentType,
      alternateName,
      alternateDescriptionHtml,
      alternateIconKey: alternateUploadedKey ?? stagedIcon?.alternateIconKey ?? undefined,
      alternateIconContentType: alternateIcon?.type ?? stagedIcon?.alternateIconContentType ?? undefined,
      comboAvailable,
      createdByUserId: user.id,
      now: clock.now(),
    });
    if (stagedIcon) {
      await slotIcons.delete(user.guildId, character, slotType, slotIndex);
    }

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
    if (alternateUploadedKey) {
      try {
        await getSkillIconsBucket().delete(alternateUploadedKey);
      } catch {
        // Best-effort cleanup only.
      }
    }
    return skillErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const rejected = validateMutationRequest(request, 2_500_000);
  if (rejected) {
    return rejected;
  }

  let uploadedKey: string | null = null;
  let alternateUploadedKey: string | null = null;
  let updateCommitted = false;
  try {
    const user = await requireSessionUser(request);
    requireAdmin(user.role);
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) {
      throw new BuildError("Не удалось определить умение.");
    }

    const current = await skills.get(user.guildId, id);
    if (!current) {
      throw new BuildError("Умение уже удалено или не найдено.");
    }

    const form = await request.formData();
    const name = validateBuildSkillName(form.get("name"));
    const descriptionHtml = sanitizeBuildSkillDescription(
      form.get("descriptionHtml"),
    );
    const hasAlternate = current.character === "Сераф";
    const alternateName = hasAlternate
      ? validateBuildSkillName(form.get("alternateName"))
      : null;
    const alternateDescriptionHtml = hasAlternate
      ? sanitizeBuildSkillDescription(form.get("alternateDescriptionHtml"))
      : null;
    const comboAvailable = validateBuildSkillComboAvailable(
      form.get("comboAvailable"),
    );
    const socketTypes = normalizeBuildSkillConfigurableSocketTypes(
      current.slotType,
      current.slotIndex,
      validateBuildSkillSocketTypes(form.get("socketTypes")),
    );
    const iconEntry = form.get("icon");
    const icon =
      iconEntry instanceof File && iconEntry.size > 0
        ? validateBuildSkillIcon(iconEntry)
        : null;
    const alternateIconEntry = form.get("alternateIcon");
    const alternateIcon =
      alternateIconEntry instanceof File && alternateIconEntry.size > 0
        ? validateBuildSkillIcon(alternateIconEntry)
        : null;
    if (hasAlternate && !alternateIcon && !current.alternateIconKey) {
      throw new BuildError("Добавьте иконку второй стойки Серафа.");
    }

    if (icon) {
      uploadedKey = `guilds/${user.guildId}/build-skills/${id}-${ids.generate()}.${iconExtension(icon.type)}`;
      await getSkillIconsBucket().put(uploadedKey, icon.stream(), {
        httpMetadata: { contentType: icon.type },
        customMetadata: {
          guildId: user.guildId,
          createdByUserId: user.id,
        },
      });
    }
    if (alternateIcon) {
      alternateUploadedKey = `guilds/${user.guildId}/build-skills/${id}-${ids.generate()}-alternate.${iconExtension(alternateIcon.type)}`;
      await getSkillIconsBucket().put(alternateUploadedKey, alternateIcon.stream(), {
        httpMetadata: { contentType: alternateIcon.type },
        customMetadata: { guildId: user.guildId, createdByUserId: user.id },
      });
    }

    const updated = await skills.update({
      guildId: user.guildId,
      id,
      name,
      descriptionHtml,
      comboAvailable,
      socketTypes,
      iconKey: uploadedKey ?? undefined,
      iconContentType: icon?.type,
      alternateName,
      alternateDescriptionHtml,
      alternateIconKey: alternateUploadedKey ?? undefined,
      alternateIconContentType: alternateIcon?.type,
      viewerUserId: user.id,
      now: clock.now(),
    });
    if (!updated) {
      throw new BuildError("Умение уже удалено или не найдено.");
    }
    updateCommitted = true;

    if (uploadedKey && current.iconKey !== uploadedKey) {
      try {
        await getSkillIconsBucket().delete(current.iconKey);
      } catch {
        // The new icon is active; stale bytes can be cleaned up later.
      }
    }
    if (alternateUploadedKey && current.alternateIconKey && current.alternateIconKey !== alternateUploadedKey) {
      try {
        await getSkillIconsBucket().delete(current.alternateIconKey);
      } catch {
        // The new alternate icon is active; stale bytes are harmless.
      }
    }

    return Response.json(
      { skill: updated },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (uploadedKey && !updateCommitted) {
      try {
        await getSkillIconsBucket().delete(uploadedKey);
      } catch {
        // Best-effort cleanup when the metadata update did not complete.
      }
    }
    if (alternateUploadedKey && !updateCommitted) {
      try {
        await getSkillIconsBucket().delete(alternateUploadedKey);
      } catch {
        // Best-effort cleanup when the update failed.
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
