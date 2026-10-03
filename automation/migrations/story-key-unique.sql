-- Apply only after auditing all rows (including Trash) for duplicate non-null
-- story_key values. EmDash's field-update API refuses changing `unique` on
-- an existing field. Preserve its metadata and add physical protection instead.
-- SQLite UNIQUE permits multiple NULL values. Trash retains the key reservation.
CREATE UNIQUE INDEX IF NOT EXISTS pt_articles_story_key_unique
ON ec_articles(story_key);
