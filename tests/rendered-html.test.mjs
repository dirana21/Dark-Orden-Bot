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
  assert.match(contents, /black-sun-icon\.png/);
  assert.match(contents, /api\/vengeful-souls/);
  assert.match(contents, /vengeful-souls-icon\.png/);
  assert.match(contents, /api\/planner/);
  assert.match(contents, /href:`\/build`/);
  assert.match(contents, /Основной герой/);
  assert.match(contents, /Зеркало/);
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
  assert.match(contents, /event-nav-mobile/);
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
