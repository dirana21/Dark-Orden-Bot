import { AuthError } from "@/domain/auth/errors";
import { BuildError } from "@/domain/build/errors";
import { canManageBuildSkills } from "@/domain/build/permissions";
import {
  validateBuildCharacter,
  validateBuildSkillIcon,
  validateBuildSkillSlotIndex,
  validateBuildSkillSlotType,
} from "@/domain/build/validation";
import { D1BuildCharacterRepository } from "@/infrastructure/build/d1-build-character-repository";
import { D1BuildSkillRepository } from "@/infrastructure/build/d1-build-skill-repository";
import { D1BuildSkillSlotIconRepository } from "@/infrastructure/build/d1-build-skill-slot-icon-repository";
import { getSkillIconsBucket } from "@/infrastructure/db/d1";
import { CryptoIdGenerator, SystemClock } from "@/infrastructure/system/system-services";
import { authUseCases } from "../../auth/_shared/dependencies";
import { authErrorResponse, readSessionCookie, validateMutationRequest } from "../../auth/_shared/http";

const characters = new D1BuildCharacterRepository();
const skills = new D1BuildSkillRepository();
const slotIcons = new D1BuildSkillSlotIconRepository();
const ids = new CryptoIdGenerator();
const clock = new SystemClock();

function extension(contentType: string) {
  return contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
}

async function requireUser(request: Request) {
  const user = await authUseCases.getSession.execute(readSessionCookie(request));
  if (!user) throw new AuthError("UNAUTHORIZED", "Войдите в аккаунт, чтобы открыть иконки умений.");
  return user;
}

function errorResponse(error: unknown) {
  if (error instanceof BuildError) {
    return Response.json({ error: error.message }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  return authErrorResponse(error);
}

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const character = validateBuildCharacter(new URL(request.url).searchParams.get("character"));
    return Response.json({ slotIcons: await slotIcons.list(user.guildId, character) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  const rejected = validateMutationRequest(request, 2_500_000);
  if (rejected) return rejected;

  let uploadedKey: string | null = null;
  let saved = false;
  try {
    const user = await requireUser(request);
    if (!canManageBuildSkills(user.role)) throw new AuthError("FORBIDDEN", "Загружать иконки умений могут только редакторы.");
    const form = await request.formData();
    const character = validateBuildCharacter(form.get("character"));
    if (!await characters.findByName(user.guildId, character)) throw new BuildError("Персонаж не найден в каталоге.");
    const slotType = validateBuildSkillSlotType(form.get("slotType"));
    const slotIndex = validateBuildSkillSlotIndex(slotType, form.get("slotIndex"));
    if (await skills.getBySlot(user.guildId, character, slotType, slotIndex)) {
      throw new BuildError("В этом слоте уже есть готовое умение.");
    }
    const icon = validateBuildSkillIcon(form.get("icon"));
    const previous = await slotIcons.get(user.guildId, character, slotType, slotIndex);
    uploadedKey = `guilds/${user.guildId}/build-skill-slots/${ids.generate()}.${extension(icon.type)}`;
    await getSkillIconsBucket().put(uploadedKey, icon.stream(), {
      httpMetadata: { contentType: icon.type },
      customMetadata: { guildId: user.guildId, createdByUserId: user.id },
    });
    const slotIcon = await slotIcons.upsert({ guildId: user.guildId, character, slotType, slotIndex, iconKey: uploadedKey, iconContentType: icon.type, createdByUserId: user.id, now: clock.now() });
    saved = true;
    if (previous?.iconKey && previous.iconKey !== uploadedKey) {
      try { await getSkillIconsBucket().delete(previous.iconKey); } catch { /* stale bytes are harmless */ }
    }
    return Response.json({ slotIcon }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (uploadedKey && !saved) {
      try { await getSkillIconsBucket().delete(uploadedKey); } catch { /* best effort */ }
    }
    return errorResponse(error);
  }
}
