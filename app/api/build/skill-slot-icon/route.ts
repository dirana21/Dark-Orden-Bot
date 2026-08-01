import { AuthError } from "@/domain/auth/errors";
import { validateBuildCharacter, validateBuildSkillSlotIndex, validateBuildSkillSlotType } from "@/domain/build/validation";
import { D1BuildSkillSlotIconRepository } from "@/infrastructure/build/d1-build-skill-slot-icon-repository";
import { getSkillIconsBucket } from "@/infrastructure/db/d1";
import { authUseCases } from "../../auth/_shared/dependencies";
import { authErrorResponse, readSessionCookie } from "../../auth/_shared/http";

const slotIcons = new D1BuildSkillSlotIconRepository();

export async function GET(request: Request) {
  try {
    const user = await authUseCases.getSession.execute(readSessionCookie(request));
    if (!user) throw new AuthError("UNAUTHORIZED", "Войдите в аккаунт, чтобы открыть иконку умения.");
    const params = new URL(request.url).searchParams;
    const character = validateBuildCharacter(params.get("character"));
    const slotType = validateBuildSkillSlotType(params.get("slotType"));
    const slotIndex = validateBuildSkillSlotIndex(slotType, params.get("slotIndex"));
    const slotIcon = await slotIcons.get(user.guildId, character, slotType, slotIndex);
    if (!slotIcon) return new Response("Not found", { status: 404 });
    const isAlternate = params.get("variant") === "alternate";
    const iconKey = isAlternate ? slotIcon.alternateIconKey : slotIcon.iconKey;
    const contentType = isAlternate ? slotIcon.alternateIconContentType : slotIcon.iconContentType;
    if (!iconKey || !contentType) return new Response("Not found", { status: 404 });
    const object = await getSkillIconsBucket().get(iconKey);
    if (!object) return new Response("Not found", { status: 404 });
    return new Response(object.body, { headers: { "Content-Type": contentType, "Content-Length": String(object.size), "Cache-Control": "private, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
