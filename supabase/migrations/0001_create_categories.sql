CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "icon" text,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);