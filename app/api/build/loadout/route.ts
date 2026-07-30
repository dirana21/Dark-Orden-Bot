import { AuthError } from "@/domain/auth/errors";
import { BuildError } from "@/domain/build/errors";
import { validateBuildCharacter } from "@/domain/build/validation";
import {
  validatePlayerBuildSetupType,
  validatePlayerBuildSlots,
} from "@/domain/build/player-build-validation";
import { D1BuildCharacterRepository } from "@/infrastructure/build/d1-build-character-repository";
import { D1PlayerBuildRepository } from "@/infrastructure/build/d1-player-build-repository";
import { D1BuildSigilRepository } from "@/infrastructure/build/d1-build-sigil-repository";
import { D1BuildSkillRepository } from "@/infrastructure/build/d1-build-skill-repository";
import { SystemClock } from "@/infrastructure/system/system-services";
import { authUseCases } from "../../auth/_shared/dependencies";
import {
  authErrorResponse,
  readSessionCookie,
  validateMutationRequest,
} from "../../auth/_shared/http";

const characters = new D1BuildCharacterRepository();
const loadouts = new D1PlayerBuildRepository();
const skills = new D1BuildSkillRepository();
const sigils = new D1BuildSigilRepository();
const clock = new SystemClock();

async function requireSessionUser(request: Request) {
  const user = await authUseCases.getSession.execute(
    readSessionCookie(request),
  );
  if (!user) {
    throw new AuthError(
      "UNAUTHORIZED",
      "Войдите в аккаунт, чтобы открыть личный билд.",
    );
  }
  return user;
}

function loadoutErrorResponse(error: unknown): Response {
  if (error instanceof BuildError) {
    return Response.json(
      { error: error.message },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  return authErrorResponse(error);
}

async function requireCatalogCharacter(
  guildId: string,
  value: unknown,
) {
  const character = validateBuildCharacter(value);
  if (!(await characters.findByName(guildId, character))) {
    throw new BuildError("Персонаж не найден в каталоге.");
  }
  return character;
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser(request);
    const url = new URL(request.url);
    const character = await requireCatalogCharacter(
      user.guildId,
      url.searchParams.get("character"),
    );
    const setupType = validatePlayerBuildSetupType(
      url.searchParams.get("setup"),
    );
    return Response.json(
      {
        loadout: await loadouts.get(
          user.id,
          character,
          setupType,
        ),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return loadoutErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  const rejected = validateMutationRequest(request, 32_768);
  if (rejected) {
    return rejected;
  }

  try {
    const user = await requireSessionUser(request);
    const input = (await request.json()) as {
      character?: unknown;
      setupType?: unknown;
      slots?: unknown;
    };
    const character = await requireCatalogCharacter(
      user.guildId,
      input.character,
    );
    const requestedSlots = validatePlayerBuildSlots(input.slots);
    const setupType = validatePlayerBuildSetupType(input.setupType);
    const [skillCatalog, sigilCatalog] = await Promise.all([
      skills.list(user.guildId, user.id, character),
      sigils.list(user.guildId),
    ]);
    const skillsById = new Map(
      skillCatalog.map((skill) => [skill.id, skill]),
    );
    const sigilsById = new Map(
      sigilCatalog.map((sigil) => [sigil.id, sigil]),
    );

    const slots = requestedSlots.map((slot) => {
      const skill = skillsById.get(slot.skillId);
      if (!skill) {
        throw new BuildError(
          "Один из выбранных навыков больше недоступен.",
        );
      }
      if (
        slot.sigilIds
          .slice(skill.socketTypes.length)
          .some(Boolean)
      ) {
        throw new BuildError(
          `Для навыка «${skill.name}» указан лишний сигил.`,
        );
      }

      return {
        skillId: skill.id,
        comboEnabled: skill.comboAvailable
          ? slot.comboEnabled === true
          : null,
        sigilIds: skill.socketTypes.map((socketType, index) => {
          const sigilId = slot.sigilIds[index] ?? null;
          if (!sigilId) {
            return null;
          }
          const sigil = sigilsById.get(sigilId);
          if (!sigil || sigil.category !== socketType) {
            throw new BuildError(
              `Сигил не подходит в сокет «${socketType}» навыка «${skill.name}».`,
            );
          }
          return sigil.id;
        }),
      };
    });

    return Response.json(
      {
        loadout: await loadouts.save({
          userId: user.id,
          character,
          setupType,
          slots,
          now: clock.now(),
        }),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return loadoutErrorResponse(error);
  }
}
