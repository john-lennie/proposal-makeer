ALTER TABLE "proposals" DROP CONSTRAINT "proposals_client_id_clients_id_fk";
--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_current_published_revision_id_proposal_revisions_id_fk" FOREIGN KEY ("current_published_revision_id") REFERENCES "public"."proposal_revisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clients_workspace_id_unique" ON "clients" USING btree ("workspace_id","id");--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_client_workspace_fk" FOREIGN KEY ("workspace_id","client_id") REFERENCES "public"."clients"("workspace_id","id") ON DELETE restrict ON UPDATE no action;
