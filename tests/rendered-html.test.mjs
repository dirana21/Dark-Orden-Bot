import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function collectJavaScript(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const contents = [];

  for (const entry of entries) {
    const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
    if (entry.isDirectory()) {
      contents.push(...(await collectJavaScript(url)));
    } else if (entry.name.endsWith(".js")) {
      contents.push(await readFile(url, "utf8"));
    }
  }

  return contents;
}

test("build contains the Dark Orden application and protected routes", async () => {
  const dist = new URL("../dist/", import.meta.url);
  const contents = (await collectJavaScript(dist)).join("\n");

  assert.match(contents, /DARK ORDEN/i);
  assert.match(contents, /Проверяем доступ к штабу/);
  assert.match(contents, /api\/auth\/register/);
  assert.match(contents, /guildIdentifier/);
  assert.match(contents, /REGISTRATION_IDENTIFIER/);
  assert.match(contents, /api\/profile/);
  assert.match(contents, /api\/black-sun/);
  assert.match(contents, /black-sun-icon\.webp/);
  assert.match(contents, /api\/vengeful-souls/);
  assert.match(contents, /vengeful-souls-icon\.webp/);
  assert.match(contents, /api\/planner/);
  assert.match(contents, /href:`\/build`/);
  assert.match(contents, /api\/build/);
  assert.match(contents, /api\/build\/skills/);
  assert.match(contents, /api\/build\/skill-icon/);
  assert.match(contents, /api\/build\/skill-combo/);
  assert.match(contents, /api\/build\/loadout/);
  assert.match(contents, /api\/build\/community/);
  assert.match(contents, /combo-on\.webp/);
  assert.match(contents, /combo-off\.webp/);
  assert.match(contents, /Добавить выбор комбо/);
  assert.match(contents, /Нет пункта комбо/);
  assert.match(contents, /С комбо/);
  assert.match(contents, /Без комбо/);
  assert.match(contents, /Редактор умений/);
  assert.match(contents, /Цвет текста/);
  assert.match(contents, /Маркированный список/);
  assert.match(contents, /Добавить для всех/);
  assert.match(contents, /Редактировать умение/);
  assert.match(contents, /Сохранить изменения/);
  assert.match(contents, /build_skills/);
  assert.match(contents, /user_build_loadouts/);
  assert.match(contents, /Мои билды/);
  assert.match(contents, /10 слотов навыков/);
  assert.match(contents, /Сохранить билд/);
  assert.match(contents, /Массовое PvP/);
  assert.match(contents, /Билды игроков/);
  assert.match(contents, /Выберите любого персонажа/);
  assert.match(contents, /Профиль игрока/);
  assert.match(contents, /Основной герой/);
  assert.match(contents, /Зеркало/);
  assert.match(contents, /Мертвый Глаз/);
  assert.match(contents, /Сераф/);
  assert.match(contents, /План гильдии и мои заметки/);
  assert.match(contents, /Галочки снимутся завтра/);
  assert.match(contents, /Незакрытые задачи/);
  assert.match(contents, /notification-counter--daily/);
  assert.match(contents, /notification-counter--weekly/);
  assert.match(contents, /notification-counter--monthly/);
  assert.match(contents, /Общие задачи гильдии/);
  assert.match(contents, /Мои заметки/);
  assert.doesNotMatch(contents, /Предыдущая неделя/);
  assert.match(contents, /planner_tasks/);
  assert.match(contents, /guild_planner_tasks/);
  assert.match(contents, /Night of Vengeful Souls/);
  assert.match(contents, /mobile-site-nav/);
  assert.match(contents, /Герои, навыки, сокеты и сигилы/);
  assert.match(contents, /black-sun-event-card/);
  assert.match(contents, /event-session-card/);
  assert.match(contents, /event-role-option/);
  assert.match(contents, /Выберите роль/);
  assert.match(contents, /guildMemberCount/);
  assert.match(contents, /visible_members\.is_hidden = 0/);
  assert.match(contents, /Чёрное Солнце/);
  assert.match(contents, /real_name/);
  assert.match(contents, /HttpOnly/);
  assert.match(contents, /Content-Security-Policy/);
  assert.doesNotMatch(contents, /react-loading-skeleton/i);
});
