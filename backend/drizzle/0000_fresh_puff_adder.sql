CREATE TYPE "public"."attribution_model" AS ENUM('primeiro_clique', 'ultimo_clique');--> statement-breakpoint
CREATE TYPE "public"."lead_origem" AS ENUM('anuncio', 'organico');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('novo', 'em_atendimento', 'qualificado', 'ganho', 'perdido');--> statement-breakpoint
CREATE TYPE "public"."message_direcao" AS ENUM('entrada', 'saida');--> statement-breakpoint
CREATE TYPE "public"."message_tipo" AS ENUM('texto', 'imagem', 'audio', 'video', 'documento', 'sticker', 'outros');--> statement-breakpoint
CREATE TYPE "public"."webhook_source" AS ENUM('whatsapp_cloud', 'evolution', 'cloudia');--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text,
	"telefone" text NOT NULL,
	"mensagem_inicial" text,
	"link_whatsapp" text,
	"origem" "lead_origem" DEFAULT 'organico',
	"status" "lead_status" DEFAULT 'novo',
	"data_entrada" timestamp with time zone DEFAULT now(),
	"data_qualificacao" timestamp with time zone,
	"data_ganho" timestamp with time zone,
	"ctwaclid" text,
	"source_id" text,
	"campanha" text,
	"conjunto_anuncio" text,
	"anuncio" text,
	"titulo_anuncio" text,
	"tipo_midia" text,
	"thumbnail_url" text,
	"url_anuncio" text,
	"lead_submitted_sent" boolean DEFAULT false,
	"qualified_lead_sent" boolean DEFAULT false,
	"capi_retry_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "leads_telefone_unique" UNIQUE("telefone")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"direcao" "message_direcao" NOT NULL,
	"conteudo" text,
	"tipo" "message_tipo" DEFAULT 'texto',
	"message_id_whatsapp" text,
	"timestamp_whatsapp" timestamp with time zone,
	"veio_de_anuncio" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"meta_access_token" text,
	"meta_pixel_id" text,
	"meta_page_id" text,
	"cloudia_webhook_secret" text,
	"evolution_api_url" text,
	"evolution_api_key" text,
	"verify_token" text,
	"attribution_model" "attribution_model" DEFAULT 'ultimo_clique',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" "webhook_source" NOT NULL,
	"payload" jsonb NOT NULL,
	"processed" boolean DEFAULT false,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;