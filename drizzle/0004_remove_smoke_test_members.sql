DELETE FROM `black_sun_scores`
WHERE `user_id` IN (
  'fa4d38bf-ce54-4bb3-a794-2c559e94d724',
  'a7287980-3884-4874-9814-f5ed235632b1',
  '187b9314-66c0-4c4a-bdef-f89c734609a1'
);

DELETE FROM `sessions`
WHERE `user_id` IN (
  'fa4d38bf-ce54-4bb3-a794-2c559e94d724',
  'a7287980-3884-4874-9814-f5ed235632b1',
  '187b9314-66c0-4c4a-bdef-f89c734609a1'
);

DELETE FROM `users`
WHERE `id` IN (
  'fa4d38bf-ce54-4bb3-a794-2c559e94d724',
  'a7287980-3884-4874-9814-f5ed235632b1',
  '187b9314-66c0-4c4a-bdef-f89c734609a1'
);
