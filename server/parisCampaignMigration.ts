import { sql } from "drizzle-orm";
import { db } from "./db";

// Additive and idempotent, runs on startup in development and production.
export async function migrateParisCampaign() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS paris_campaign_signups (
      id serial PRIMARY KEY,
      full_name text NOT NULL,
      email text NOT NULL UNIQUE,
      platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
      creator_handle text NOT NULL,
      friend_handle text NOT NULL,
      request_id text UNIQUE,
      creator_code text NOT NULL UNIQUE REFERENCES event_vouchers(code),
      friend_code text NOT NULL UNIQUE REFERENCES event_vouchers(code),
      expires_at timestamp NOT NULL,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (creator_code <> friend_code)
    )
  `);
}
