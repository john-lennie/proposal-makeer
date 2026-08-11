CREATE TYPE "public"."client_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('INVITED', 'ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."proposal_decision" AS ENUM('ACCEPTED', 'DECLINED');--> statement-breakpoint
CREATE TYPE "public"."proposal_section_type" AS ENUM('cover', 'text', 'objectives', 'scope', 'deliverables', 'timeline', 'pricing', 'terms', 'acceptance');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."revision_status" AS ENUM('CURRENT', 'SUPERSEDED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('INVITED', 'ACTIVE', 'DISABLED');--> statement-breakpoint
CREATE TYPE "public"."workspace_role" AS ENUM('OWNER', 'ADMIN', 'MEMBER');--> statement-breakpoint
CREATE TYPE "public"."workspace_status" AS ENUM('ACTIVE', 'SUSPENDED', 'PENDING_DELETION');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"organization_name" varchar(200),
	"email" varchar(320),
	"phone" varchar(50),
	"notes" text,
	"status" "client_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "proposal_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_revision_id" uuid NOT NULL,
	"decision" "proposal_decision" NOT NULL,
	"respondent_name" varchar(160),
	"respondent_email" varchar(320),
	"message" text,
	"response_token_hash" text,
	"source_ip_hash" text,
	"user_agent" text,
	"responded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"slug_snapshot" varchar(120) NOT NULL,
	"client_snapshot" jsonb NOT NULL,
	"title_snapshot" varchar(240) NOT NULL,
	"currency_snapshot" varchar(3) NOT NULL,
	"theme_snapshot" jsonb NOT NULL,
	"content_snapshot" jsonb NOT NULL,
	"expires_at_snapshot" timestamp with time zone,
	"status" "revision_status" NOT NULL,
	"published_by_user_id" uuid NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_revisions_number_positive" CHECK ("proposal_revisions"."revision_number" > 0),
	CONSTRAINT "proposal_revisions_currency_format" CHECK ("proposal_revisions"."currency_snapshot" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "proposal_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"type" "proposal_section_type" NOT NULL,
	"position" integer NOT NULL,
	"content" jsonb NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "proposal_sections_position_positive" CHECK ("proposal_sections"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"title" varchar(240) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"status" "proposal_status" DEFAULT 'DRAFT' NOT NULL,
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"theme_settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"current_published_revision_id" uuid,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"password_protection_enabled" boolean DEFAULT false NOT NULL,
	"password_hash" text,
	"created_by_user_id" uuid NOT NULL,
	"last_edited_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "proposals_currency_format" CHECK ("proposals"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "proposals_password_consistency" CHECK (("proposals"."password_protection_enabled" = false and "proposals"."password_hash" is null) or ("proposals"."password_protection_enabled" = true and "proposals"."password_hash" is not null))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(160) NOT NULL,
	"avatar_url" text,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "workspace_role" NOT NULL,
	"status" "membership_status" DEFAULT 'ACTIVE' NOT NULL,
	"invited_by_user_id" uuid,
	"joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"status" "workspace_status" DEFAULT 'ACTIVE' NOT NULL,
	"default_currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"timezone" varchar(100) DEFAULT 'America/Toronto' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "workspaces_currency_format" CHECK ("workspaces"."default_currency" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_responses" ADD CONSTRAINT "proposal_responses_proposal_revision_id_proposal_revisions_id_fk" FOREIGN KEY ("proposal_revision_id") REFERENCES "public"."proposal_revisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_revisions" ADD CONSTRAINT "proposal_revisions_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_revisions" ADD CONSTRAINT "proposal_revisions_published_by_user_id_users_id_fk" FOREIGN KEY ("published_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_sections" ADD CONSTRAINT "proposal_sections_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_last_edited_by_user_id_users_id_fk" FOREIGN KEY ("last_edited_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clients_workspace_idx" ON "clients" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "clients_workspace_status_idx" ON "clients" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_responses_revision_unique" ON "proposal_responses" USING btree ("proposal_revision_id");--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_revisions_number_unique" ON "proposal_revisions" USING btree ("proposal_id","revision_number");--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_revisions_current_unique" ON "proposal_revisions" USING btree ("proposal_id") WHERE "proposal_revisions"."status" = 'CURRENT';--> statement-breakpoint
CREATE INDEX "proposal_revisions_proposal_idx" ON "proposal_revisions" USING btree ("proposal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_sections_active_position_unique" ON "proposal_sections" USING btree ("proposal_id","position") WHERE "proposal_sections"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "proposal_sections_proposal_idx" ON "proposal_sections" USING btree ("proposal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "proposals_slug_unique" ON "proposals" USING btree ("slug") WHERE "proposals"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "proposals_workspace_idx" ON "proposals" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "proposals_client_idx" ON "proposals" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_members_active_unique" ON "workspace_members" USING btree ("workspace_id","user_id") WHERE "workspace_members"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "workspace_members_user_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_slug_unique" ON "workspaces" USING btree ("slug") WHERE "workspaces"."deleted_at" is null;