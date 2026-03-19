CREATE TABLE "connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_paused" boolean DEFAULT false,
	"meta_access_token" text,
	"meta_pixel_id" text,
	"meta_page_id" text,
	"meta_ad_account_id" text,
	"evolution_api_url" text,
	"evolution_api_key" text,
	"verify_token" text,
	"app_secret" text,
	"attribution_model" "attribution_model" DEFAULT 'ultimo_clique',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "connection_id" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE set null ON UPDATE no action;