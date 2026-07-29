"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronDown, UserRoundSearch } from "lucide-react";
import { HttpBuildSkillGateway } from "@/app/lib/build-client";
import type {
  BuildCharacter,
  BuildCharacterClass,
  BuildSkill,
} from "@/domain/build/model";
import type { BuildSigil } from "@/domain/build/sigil-model";
import { PlayerBuildPanel } from "./player-build-panel";

const skillGateway = new HttpBuildSkillGateway();

interface PersonalBuildWorkspaceProps {
  characters: BuildCharacter[];
  initialCharacter: BuildCharacterClass | null;
  displayName: string;
  sigils: BuildSigil[];
}

export function PersonalBuildWorkspace({
  characters,
  initialCharacter,
  displayName,
  sigils,
}: PersonalBuildWorkspaceProps) {
  const [character, setCharacter] = useState<BuildCharacterClass | null>(
    initialCharacter ?? characters[0]?.name ?? null,
  );
  const [skills, setSkills] = useState<BuildSkill[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!character) {
      return;
    }
    const controller = new AbortController();
    Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) {
          return null;
        }
        setIsLoadingSkills(true);
        setError("");
        return skillGateway.list(character, controller.signal);
      })
      .then((items) => {
        if (items) {
          setSkills(items);
        }
      })
      .catch((caught: unknown) => {
        if (
          !(caught instanceof DOMException && caught.name === "AbortError")
        ) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Не удалось загрузить навыки персонажа.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingSkills(false);
        }
      });

    return () => controller.abort();
  }, [character]);

  const selectedCharacter = characters.find(
    (item) => item.name === character,
  );

  if (!character) {
    return (
      <section className="player-build-no-character">
        <UserRoundSearch size={30} />
        <h2>Каталог персонажей пока пуст</h2>
        <p>Администратор должен добавить хотя бы одного персонажа.</p>
      </section>
    );
  }

  return (
    <>
      <section className="personal-build-character-picker">
        <div className="personal-build-character-picker__portrait">
          {selectedCharacter?.imageUrl ? (
            <Image
              src={selectedCharacter.imageUrl}
              alt=""
              width={180}
              height={100}
              unoptimized
            />
          ) : (
            <UserRoundSearch size={24} />
          )}
        </div>
        <div>
          <span>Конструктор игрока</span>
          <h2>Выберите любого персонажа</h2>
          <p>
            Выбор не зависит от основного героя и зеркала в вашем профиле.
          </p>
        </div>
        <label>
          <span>Персонаж для билда</span>
          <select
            value={character}
            onChange={(event) =>
              setCharacter(event.target.value as BuildCharacterClass)
            }
          >
            {characters.map((item) => (
              <option value={item.name} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <ChevronDown size={16} />
        </label>
      </section>

      {error ? (
        <p className="player-build-error" role="alert">
          {error}
        </p>
      ) : null}

      <PlayerBuildPanel
        key={character}
        character={character}
        displayName={displayName}
        skills={skills}
        sigils={sigils}
        isSkillsLoading={isLoadingSkills}
      />
    </>
  );
}
