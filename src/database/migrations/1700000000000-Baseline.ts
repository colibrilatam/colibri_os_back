import { MigrationInterface, QueryRunner } from 'typeorm';

export class Baseline1700000000000 implements MigrationInterface {
  name = 'Baseline1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "project_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "long_description" text, "problem_statement" text, "solution_statement" text, "target_audience" text, "sdg_goals" text, "value_proposition" text, "business_model_summary" text, "stage_notes" text, "pitch_url" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_e744d07363c9e6e7e543f811ec" UNIQUE ("project_id"), CONSTRAINT "PK_a5adb7b7814a29bf54d2b97100f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."project_members_gender_enum" AS ENUM('male', 'female', 'non_binary', 'other', 'prefer_not_to_say')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."project_members_role_in_team_enum" AS ENUM('founder', 'co_founder', 'cto', 'cmo', 'developer', 'designer', 'advisor', 'other')`,
    );
    await queryRunner.query(
      `CREATE TABLE "project_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "gender" "public"."project_members_gender_enum", "user_id" uuid NOT NULL, "role_in_team" "public"."project_members_role_in_team_enum" NOT NULL DEFAULT 'other', "joined_at" TIMESTAMP, "left_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "participation_weight" numeric(5,2), "is_founder" boolean NOT NULL DEFAULT false, "is_primary_operator" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b3f491d3a3f986106d281d8eb4b" UNIQUE ("project_id", "user_id"), CONSTRAINT "PK_0b2f46f804be4aea9234c78bcc9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."mecenas_nft_portfolios_portfolio_role_enum" AS ENUM('seed_ally', 'sponsor', 'guardian')`,
    );
    await queryRunner.query(
      `CREATE TABLE "mecenas_nft_portfolios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mecenas_user_id" uuid NOT NULL, "nft_project_id" uuid NOT NULL, "target_project_id" uuid, "portfolio_role" "public"."mecenas_nft_portfolios_portfolio_role_enum", "acquired_at" TIMESTAMP, "released_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_437a7138c7a5e85f6538b77fbb0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."nft_ownership_events_event_type_enum" AS ENUM('mint', 'transfer', 'assign', 'sale', 'burn')`,
    );
    await queryRunner.query(
      `CREATE TABLE "nft_ownership_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nft_project_id" uuid NOT NULL, "from_user_id" uuid, "to_user_id" uuid, "event_type" "public"."nft_ownership_events_event_type_enum" NOT NULL, "tx_hash" character varying, "occurred_at" TIMESTAMP NOT NULL, "recorded_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_aa2afcad94d15ddeac525360e85" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "nft_projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid, "chain_id" integer NOT NULL, "contract_address" character varying NOT NULL, "token_id" character varying NOT NULL, "nft_hash" character varying, "metadata_uri" character varying, "current_visual_version" character varying, "represented_tramo_id" character varying, "current_holder_user_id" uuid, "minted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_cae0319f055a18c8a8071acc14" UNIQUE ("project_id"), CONSTRAINT "PK_75b736930febe3c9be240f8bdb6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."learning_resources_resource_type_enum" AS ENUM('video', 'document', 'link', 'template', 'article', 'podcast')`,
    );
    await queryRunner.query(
      `CREATE TABLE "learning_resources" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pac_id" uuid NOT NULL, "title" character varying NOT NULL, "resource_type" "public"."learning_resources_resource_type_enum" NOT NULL, "url" character varying, "description" text, "sort_order" integer NOT NULL DEFAULT '0', "is_required" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "micro_action_definition_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1012bb5224f1a3f663f08de41fb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."rubrics_target_entity_enum" AS ENUM('micro_action', 'evidence', 'both')`,
    );
    await queryRunner.query(
      `CREATE TABLE "rubrics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "name_es" character varying NOT NULL, "name_en" character varying NOT NULL, "description_es" text, "description_en" text, "target_entity" "public"."rubrics_target_entity_enum" NOT NULL, "version" character varying NOT NULL, "criteria_json" jsonb NOT NULL, "framework_reference" character varying, "is_active" boolean NOT NULL DEFAULT true, "valid_from" TIMESTAMP WITH TIME ZONE, "valid_to" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8c35b0f2e469a003b08ced21830" UNIQUE ("code"), CONSTRAINT "PK_3dfcdc7f63f3fa048ebe0293a90" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."micro_action_definitions_micro_action_type_enum" AS ENUM('research', 'interview', 'prototype', 'validation', 'documentation', 'pitch', 'networking', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."micro_action_definitions_expected_evidence_type_enum" AS ENUM('text', 'file', 'link', 'image', 'video')`,
    );
    await queryRunner.query(
      `CREATE TABLE "micro_action_definitions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pac_id" uuid NOT NULL, "rubric_id" uuid, "code" character varying NOT NULL, "instruction_es" text NOT NULL, "instruction_en" text NOT NULL, "sort_order" integer NOT NULL, "execution_window_days" integer, "micro_action_type" "public"."micro_action_definitions_micro_action_type_enum", "is_required" boolean NOT NULL DEFAULT false, "is_reusable" boolean NOT NULL DEFAULT false, "evidence_required" boolean NOT NULL DEFAULT false, "expected_evidence_type" "public"."micro_action_definitions_expected_evidence_type_enum", "consistency_weight" numeric(5,2), "collaboration_weight" numeric(5,2), "sustainability_weight" numeric(5,2), "valid_from" TIMESTAMP, "valid_to" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_089b3e04b4eb890f63cbb5107cb" UNIQUE ("code"), CONSTRAINT "PK_95ed0c754d02ccc66411bc0c9c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "pacs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "category_id" uuid NOT NULL, "code" character varying NOT NULL, "title_es" character varying NOT NULL, "title_en" character varying NOT NULL, "objective_line_es" text, "objective_line_en" text, "description" text, "sort_order" integer NOT NULL, "execution_window_days" integer, "minimum_completion_threshold" numeric(5,2), "ic_weight" numeric(5,2), "closure_rule" text, "template_version" character varying, "is_active" boolean NOT NULL DEFAULT true, "valid_from" TIMESTAMP, "valid_to" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_80af388711bef2ac6d00206016b" UNIQUE ("code"), CONSTRAINT "PK_cc2446558ee0c293855c656e27c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."categories_uncertainty_type_enum" AS ENUM('Identitaria y de formulación', 'Incertidumbre de mercado', 'Incertidumbre técnica y operativa', 'Incertidumbre de escalabilidad', 'Incertidumbre organizacional y estratégica', 'Incertidumbre macro y sistémica')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."categories_primary_risk_type_enum" AS ENUM('humano', 'demanda', 'ejecucion', 'monetizacion', 'operativo', 'macro')`,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tramo_id" uuid NOT NULL, "code" character varying NOT NULL, "name_es" character varying NOT NULL, "name_en" character varying NOT NULL, "description_es" text, "description_en" text, "sort_order" integer NOT NULL, "execution_window_days" integer, "uncertainty_type" "public"."categories_uncertainty_type_enum", "primary_risk_type" "public"."categories_primary_risk_type_enum", "competency_mapping_key" character varying, "skill_mapping_key" character varying, "skills_key" character varying, "is_active" boolean NOT NULL DEFAULT true, "valid_from" TIMESTAMP, "valid_to" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_77d7eff8a7aaa05457a12b8007a" UNIQUE ("code"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tramos_uncertainty_type_enum" AS ENUM('Identitaria y de formulación', 'Incertidumbre de mercado', 'Incertidumbre técnica y operativa', 'Incertidumbre de escalabilidad', 'Incertidumbre organizacional y estratégica', 'Incertidumbre macro y sistémica')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tramos_primary_risk_type_enum" AS ENUM('humano', 'demanda', 'ejecucion', 'monetizacion', 'operativo', 'macro')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tramos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "name_es" character varying NOT NULL, "name_en" character varying NOT NULL, "description_es" text, "description_en" text, "sort_order" integer NOT NULL, "execution_window_days" integer, "uncertainty_type" "public"."tramos_uncertainty_type_enum", "primary_risk_type" "public"."tramos_primary_risk_type_enum", "associatedRisks" text array, "ic_floor" numeric(5,2), "eligibility_rule_es" text, "eligibility_rule_en" text, "public_threshold" numeric(5,2), "is_active" boolean NOT NULL DEFAULT true, "valid_from" TIMESTAMP, "valid_to" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_597b5dfba4b1763bc09a407ed2c" UNIQUE ("code"), CONSTRAINT "PK_e743699c1327c395a2d8c898b28" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."project_pacs_status_enum" AS ENUM('pending', 'in_progress', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "project_pacs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "pac_id" uuid NOT NULL, "status" "public"."project_pacs_status_enum" NOT NULL DEFAULT 'pending', "progress" numeric(5,2), "started_at" TIMESTAMP, "completed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dfba057b11a2fb0b264fd77f4cc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."projects_status_enum" AS ENUM('active', 'inactive', 'closed', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."projects_trajectory_status_enum" AS ENUM('on_track', 'at_risk', 'stalled', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_user_id" uuid NOT NULL, "project_name" character varying NOT NULL, "project_image" text, "status" "public"."projects_status_enum" NOT NULL DEFAULT 'active', "country" character varying, "industry" character varying, "tagline" character varying, "short_description" text, "startup_linkedin_url" character varying, "website_url" character varying, "rlab_profile_url" character varying, "opened_at" TIMESTAMP, "closed_at" TIMESTAMP, "close_reason" character varying, "current_tramo_id" uuid, "current_pac_id" character varying, "trajectory_status" "public"."projects_trajectory_status_enum", "nft_image_url" character varying, "last_activity_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."nft_actors_actor_nft_type_enum" AS ENUM('mentor', 'mecenas')`,
    );
    await queryRunner.query(
      `CREATE TABLE "nft_actors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "actor_nft_type" "public"."nft_actors_actor_nft_type_enum" NOT NULL, "chain_id" integer NOT NULL, "contract_address" character varying NOT NULL, "token_id" character varying NOT NULL, "nft_hash" character varying, "metadata_uri" character varying, "minted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_20ed50ded09c96b2b4db397fdc" UNIQUE ("user_id"), CONSTRAINT "PK_4503e19082c18767fd27f1e0d77" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('entrepreneur', 'mentor', 'evaluator', 'mecenas_semilla', 'mecenas_fundacional', 'mecenas_cambio', 'admin', 'guest')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'inactive', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_provider_enum" AS ENUM('local', 'google')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_gender_enum" AS ENUM('male', 'female', 'non_binary', 'other', 'prefer_not_to_say')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying, "full_name" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL, "status" "public"."users_status_enum" NOT NULL DEFAULT 'active', "provider" "public"."users_provider_enum" NOT NULL DEFAULT 'local', "linkedin_id" character varying, "google_id" character varying, "crypto_wallet" character varying, "credentials_wallet" character varying, "adn_hash" character varying, "bio" text, "avatar" text, "gender" "public"."users_gender_enum", "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b" UNIQUE ("google_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_role_change_audits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "target_user_id" character varying NOT NULL, "changed_by_user_id" character varying NOT NULL, "previous_role" character varying NOT NULL, "next_role" character varying NOT NULL, "reason" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_535dded7bf12de00760d525869c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "project_tramo_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "tramo_id" uuid NOT NULL, "entered_at" TIMESTAMP WITH TIME ZONE NOT NULL, "left_at" TIMESTAMP WITH TIME ZONE, "days_in_tramo" integer, "change_reason" text, "changed_by_user_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_767ea1747ee41323e8c9a588875" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ic_algorithm_versions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "description" text, "weight_action" numeric(5,2) NOT NULL, "weight_evidence" numeric(5,2) NOT NULL, "weight_consistency" numeric(5,2) NOT NULL, "weight_collaboration" numeric(5,2) NOT NULL, "weight_sustainability" numeric(5,2) NOT NULL, "consistency_formula_json" jsonb, "collaboration_formula_json" jsonb, "sustainability_rubric_version" character varying, "effective_from" TIMESTAMP NOT NULL, "effective_to" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "approved_by" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_122d44143702b37ff40c4007729" UNIQUE ("code"), CONSTRAINT "PK_13ce8d773b8bf43660df448e7b3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "reputation_index_explanations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "snapshot_id" uuid NOT NULL, "metric_key" character varying NOT NULL, "source_entity" character varying NOT NULL, "source_entity_id" character varying NOT NULL, "contribution_value" numeric(8,4), "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e5d4bc471df0cd2bf9de6ce82e0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reputation_index_snapshots_eligibility_status_enum" AS ENUM('eligible', 'not_eligible', 'pending', 'under_review')`,
    );
    await queryRunner.query(
      `CREATE TABLE "reputation_index_snapshots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid, "user_id" uuid, "tramo_id" uuid, "algorithm_version_id" uuid NOT NULL, "action_score" numeric(5,2), "evidence_score" numeric(5,2), "consistency_score" numeric(5,2), "collaboration_score" numeric(5,2), "sustainability_score" numeric(5,2), "ic_raw" numeric(5,2), "ic_public" numeric(5,2), "eligibility_status" "public"."reputation_index_snapshots_eligibility_status_enum" NOT NULL DEFAULT 'pending', "explanation_json" jsonb, "calculated_at" TIMESTAMP NOT NULL, "valid_from" TIMESTAMP, "valid_to" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ad452cbd7e93ddecf6b8b202947" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "evidence_versions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "evidence_id" uuid NOT NULL, "version_number" integer NOT NULL, "storage_uri" character varying, "content_hash" character varying, "hash_algorithm" character varying, "cloudinary_public_id" character varying, "asset_version" character varying, "provider_checksum" character varying, "mime_type" character varying, "byte_size" integer, "change_summary" text, "is_material_change" boolean NOT NULL DEFAULT false, "supersedes_version_number" integer, "created_by_user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8e73f8fd620399aa2eeae1fddf5" UNIQUE ("evidence_id", "version_number"), CONSTRAINT "PK_f7f43fd9063ea61900e7448dd08" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."evaluation_ai_results_ai_result_enum" AS ENUM('approved', 'rejected', 'needs_revision')`,
    );
    await queryRunner.query(
      `CREATE TABLE "evaluation_ai_results" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "evaluation_id" uuid NOT NULL, "rubric_id" uuid NOT NULL, "rubric_version" character varying NOT NULL, "ai_model_used" character varying NOT NULL, "ai_model_version" character varying, "ai_result" "public"."evaluation_ai_results_ai_result_enum", "ai_score" numeric(5,2), "ai_dimension_scores_json" jsonb, "ai_confidence" numeric(5,2), "ai_reasoning" text, "raw_response_json" jsonb, "processed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_3d2e4caa670ca397da1e3c3933" UNIQUE ("evaluation_id"), CONSTRAINT "PK_77fbf3d87ec3296dcc9c631af0d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."evaluation_human_reviews_review_decision_enum" AS ENUM('approved', 'rejected', 'modified')`,
    );
    await queryRunner.query(
      `CREATE TABLE "evaluation_human_reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "evaluation_id" uuid NOT NULL, "reviewer_user_id" uuid NOT NULL, "review_decision" "public"."evaluation_human_reviews_review_decision_enum" NOT NULL, "human_score" numeric(5,2), "human_dimension_scores_json" jsonb, "agrees_with_ai" boolean, "override_reason" text, "comment" text, "reviewed_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_8e7d5d1475798725fba41d4d4f" UNIQUE ("evaluation_id"), CONSTRAINT "PK_64ccbefc1e232fd70dbfa150dec" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."evaluations_evaluation_type_enum" AS ENUM('automatic', 'human', 'hybrid')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."evaluations_evaluation_result_enum" AS ENUM('approved', 'rejected', 'needs_revision')`,
    );
    await queryRunner.query(
      `CREATE TABLE "evaluations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "evidence_id" uuid NOT NULL, "rubric_id" uuid NOT NULL, "rubric_version" character varying NOT NULL, "created_by_user_id" character varying, "finalized_by_user_id" character varying, "evaluation_type" "public"."evaluations_evaluation_type_enum" NOT NULL DEFAULT 'hybrid', "evaluation_result" "public"."evaluations_evaluation_result_enum", "score" numeric(5,2), "dimension_scores_json" jsonb, "is_final" boolean NOT NULL DEFAULT false, "evaluation_source_weight" numeric(5,2), "comment" text, "evaluated_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f683b433eba0e6dae7e19b29e29" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."evidences_evidence_type_enum" AS ENUM('text', 'file', 'link', 'image', 'video')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."evidences_status_enum" AS ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'deletion_pending')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."evidences_validation_status_enum" AS ENUM('pending', 'ai_reviewed', 'human_reviewed', 'validated', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."evidences_validation_confidence_enum" AS ENUM('low', 'medium', 'high')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."evidences_privacy_level_enum" AS ENUM('public', 'private', 'restricted')`,
    );
    await queryRunner.query(
      `CREATE TABLE "evidences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "micro_action_instance_id" uuid NOT NULL, "author_user_id" uuid NOT NULL, "project_id" uuid NOT NULL, "evidence_type" "public"."evidences_evidence_type_enum" NOT NULL, "status" "public"."evidences_status_enum" NOT NULL DEFAULT 'draft', "validation_status" "public"."evidences_validation_status_enum" NOT NULL DEFAULT 'pending', "is_valid_for_ic" boolean NOT NULL DEFAULT false, "validation_confidence" "public"."evidences_validation_confidence_enum", "privacy_level" "public"."evidences_privacy_level_enum" NOT NULL DEFAULT 'private', "description" text, "canonical_uri" character varying, "content_hash" character varying, "validated_by_user_id" uuid, "validation_notes" text, "public_signal_enabled" boolean NOT NULL DEFAULT false, "submitted_at" TIMESTAMP, "approved_at" TIMESTAMP, "rejected_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bffc6fa8c23f9fd2e2a6d165d45" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."micro_action_instances_status_enum" AS ENUM('pending', 'started', 'in_progress', 'submitted', 'validated', 'completed', 'closed', 'reopened')`,
    );
    await queryRunner.query(
      `CREATE TABLE "micro_action_instances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actor_user_id" uuid NOT NULL, "project_id" uuid NOT NULL, "micro_action_definition_id" uuid NOT NULL, "status" "public"."micro_action_instances_status_enum" NOT NULL DEFAULT 'pending', "started_at" TIMESTAMP WITH TIME ZONE, "submitted_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "validated_at" TIMESTAMP WITH TIME ZONE, "closed_at" TIMESTAMP WITH TIME ZONE, "execution_window_days_snapshot" integer, "is_on_time" boolean, "attempt_number" integer NOT NULL DEFAULT '1', "reopened_count" integer NOT NULL DEFAULT '0', "execution_notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_48c2728e40bb4b027aba9d34219" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "upload_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "evidence_id" uuid NOT NULL, "author_user_id" uuid NOT NULL, "project_id" uuid NOT NULL, "expected_public_id" character varying NOT NULL, "folder" character varying NOT NULL, "mime_type" character varying NOT NULL, "resource_type" character varying NOT NULL, "max_bytes" integer NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "consumed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a1a3ac4e894483f3ff497ca72fa" UNIQUE ("expected_public_id"), CONSTRAINT "PK_4b6ca30b8bb2baa0de9c6bf8fea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."evidence_deletion_outbox_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "evidence_deletion_outbox" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "evidence_id" character varying NOT NULL, "cloudinary_public_id" character varying, "resource_type" character varying NOT NULL DEFAULT 'raw', "status" "public"."evidence_deletion_outbox_status_enum" NOT NULL DEFAULT 'pending', "attempts" integer NOT NULL DEFAULT '0', "last_error" text, "requested_by_user_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "processed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_71c18980a48d71e6465c5b774b1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f6fda64c27e38f600c6bc103d6" ON "evidence_deletion_outbox" ("evidence_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b57cd853fa0be62fc9286af620" ON "evidence_deletion_outbox" ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."digital_credentials_credential_type_enum" AS ENUM('evidence_approved')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."digital_credentials_status_enum" AS ENUM('issued', 'revoked')`,
    );
    await queryRunner.query(
      `CREATE TABLE "digital_credentials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "user_id" uuid NOT NULL, "evidence_id" uuid NOT NULL, "evaluation_id" uuid NOT NULL, "credential_type" "public"."digital_credentials_credential_type_enum" NOT NULL DEFAULT 'evidence_approved', "status" "public"."digital_credentials_status_enum" NOT NULL DEFAULT 'issued', "credential_hash" character varying, "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "revoked_reason" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_721a544f3bf3e8707a803d80001" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "dim_pacs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pac_id" uuid NOT NULL, "category_id" uuid NOT NULL, "code" character varying NOT NULL, "title" character varying NOT NULL, "sort_order" integer NOT NULL, "template_version" character varying, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "REL_fe3098111a63247b991c8c3bef" UNIQUE ("pac_id"), CONSTRAINT "PK_d748d883be21d15422347502ab5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "dim_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "category_id" uuid NOT NULL, "tramo_id" uuid NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, "sort_order" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "REL_d0ea6180de88417457da185765" UNIQUE ("category_id"), CONSTRAINT "PK_832da750e12b96741ea51c7d59d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fact_sustainability_signals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "tramo_id" uuid NOT NULL, "rubric_version" character varying NOT NULL, "sustainability_score_raw" numeric(5,2), "sustainability_score_normalized" numeric(5,2), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b115ce5d0e9e8d4154338ae349c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "dim_tramos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tramo_id" uuid NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, "sort_order" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "REL_983e2a8949e1bb283ac032fbf1" UNIQUE ("tramo_id"), CONSTRAINT "PK_9c9a30a5533c6a3d129e55cb686" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fact_project_activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "tramo_id" uuid NOT NULL, "pac_id" uuid, "period_start" TIMESTAMP NOT NULL, "period_end" TIMESTAMP NOT NULL, "total_micro_actions" integer NOT NULL DEFAULT '0', "completed_micro_actions" integer NOT NULL DEFAULT '0', "valid_micro_actions" integer NOT NULL DEFAULT '0', "late_micro_actions" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_28308328d7beb5e067040ec7159" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fact_collaboration_impacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "period_start" TIMESTAMP NOT NULL, "period_end" TIMESTAMP NOT NULL, "verified_collaboration_count" integer NOT NULL DEFAULT '0', "weighted_collaboration_score" numeric(5,2), "unique_collaborators_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6caca362d4bcb105827d3b13793" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fact_skill_signals_level_enum" AS ENUM('beginner', 'intermediate', 'advanced', 'expert')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fact_skill_signals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "user_id" uuid, "primary_skill_code" character varying, "skill_code" character varying NOT NULL, "level" "public"."fact_skill_signals_level_enum" NOT NULL, "signal_strength" numeric(5,2), "source_evidence_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7a74f3e732f7a73bbc9598f08e0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "dim_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "full_name" character varying NOT NULL, "role" character varying, "status" character varying, "country" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_3d80e7e0e24c673627f0eaee4a" UNIQUE ("user_id"), CONSTRAINT "PK_51174cfcf185adf07ba37431f6a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fact_competency_signals_level_enum" AS ENUM('beginner', 'intermediate', 'advanced', 'expert')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fact_competency_signals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "user_id" uuid, "competency_area_code" character varying, "competency_code" character varying NOT NULL, "level" "public"."fact_competency_signals_level_enum" NOT NULL, "signal_strength" numeric(5,2), "source_evidence_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f8a78e6fa70139ac0f8119ddcee" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "dim_projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "project_name" character varying NOT NULL, "country" character varying, "industry" character varying, "status" character varying, "current_tramo_id" character varying, "trajectory_status" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_7d2a730dc97bbee74d2b2dfa80" UNIQUE ("project_id"), CONSTRAINT "PK_a3f853d2295829837c63b6b2d7e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fact_validated_evidences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "tramo_id" uuid NOT NULL, "period_start" TIMESTAMP NOT NULL, "period_end" TIMESTAMP NOT NULL, "validated_evidence_count" integer NOT NULL DEFAULT '0', "rejected_evidence_count" integer NOT NULL DEFAULT '0', "pending_evidence_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_877bbdec42a26c10972e0331cdc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "dim_time" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_date" date NOT NULL, "day" integer NOT NULL, "month" integer NOT NULL, "month_name" character varying NOT NULL, "quarter" integer NOT NULL, "year" integer NOT NULL, "week_of_year" integer NOT NULL, "day_of_week" integer NOT NULL, "day_name" character varying NOT NULL, CONSTRAINT "UQ_f6383fe9f2e668cb4efb47d5016" UNIQUE ("full_date"), CONSTRAINT "PK_63c786da5e2a4ad292c3c6eebc0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "dim_algorithm_versions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "algorithm_version_id" uuid NOT NULL, "code" character varying NOT NULL, "description" text, "effective_from" TIMESTAMP NOT NULL, "effective_to" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "REL_31c6774bb3d274473559a8a572" UNIQUE ("algorithm_version_id"), CONSTRAINT "PK_d4852b28958c0240c043c143b0e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_profiles" ADD CONSTRAINT "FK_e744d07363c9e6e7e543f811ec7" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ADD CONSTRAINT "FK_b5729113570c20c7e214cf3f58d" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ADD CONSTRAINT "FK_e89aae80e010c2faa72e6a49ce8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mecenas_nft_portfolios" ADD CONSTRAINT "FK_543c144197995df6e38466a887a" FOREIGN KEY ("mecenas_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mecenas_nft_portfolios" ADD CONSTRAINT "FK_c9d52c5d4d8938b791e54252e6b" FOREIGN KEY ("nft_project_id") REFERENCES "nft_projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mecenas_nft_portfolios" ADD CONSTRAINT "FK_e71a94a1d5493137c06c0003244" FOREIGN KEY ("target_project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "nft_ownership_events" ADD CONSTRAINT "FK_586b798170535dfeffdab9a8131" FOREIGN KEY ("nft_project_id") REFERENCES "nft_projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "nft_ownership_events" ADD CONSTRAINT "FK_b01e4ae820d70ea0209b26021d7" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "nft_ownership_events" ADD CONSTRAINT "FK_6734373e8e84779a2edf779cad8" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "nft_projects" ADD CONSTRAINT "FK_cae0319f055a18c8a8071acc14c" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "nft_projects" ADD CONSTRAINT "FK_187e0d99002d208c34e17649115" FOREIGN KEY ("current_holder_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_resources" ADD CONSTRAINT "FK_1248dda687764c10b33c72377bd" FOREIGN KEY ("pac_id") REFERENCES "pacs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_resources" ADD CONSTRAINT "FK_b03123d9184d200a4a475df5f64" FOREIGN KEY ("micro_action_definition_id") REFERENCES "micro_action_definitions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "micro_action_definitions" ADD CONSTRAINT "FK_9885e5778a9e81378ab7dec2b81" FOREIGN KEY ("pac_id") REFERENCES "pacs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "micro_action_definitions" ADD CONSTRAINT "FK_ef8d2fc547bbb46d0d59e47b482" FOREIGN KEY ("rubric_id") REFERENCES "rubrics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pacs" ADD CONSTRAINT "FK_421465d524473695bbd63a99f71" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_f3a3e3b32b8e9d8ca850e217fd6" FOREIGN KEY ("tramo_id") REFERENCES "tramos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_pacs" ADD CONSTRAINT "FK_31f196e52d4738556d6b38fb7cc" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_pacs" ADD CONSTRAINT "FK_1f7a5c272789d671918aa63502d" FOREIGN KEY ("pac_id") REFERENCES "pacs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_6a40ca0781a8e93d750f07b5659" FOREIGN KEY ("current_tramo_id") REFERENCES "tramos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_03c82619d37f3e241bc77cbcca5" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "nft_actors" ADD CONSTRAINT "FK_20ed50ded09c96b2b4db397fdcc" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_tramo_history" ADD CONSTRAINT "FK_6ed0770c8164afad1b22cef90e8" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_tramo_history" ADD CONSTRAINT "FK_9957773b04636534c9b1123f777" FOREIGN KEY ("tramo_id") REFERENCES "tramos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reputation_index_explanations" ADD CONSTRAINT "FK_22aed8ea93340ab4d0cb72a1d0d" FOREIGN KEY ("snapshot_id") REFERENCES "reputation_index_snapshots"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reputation_index_snapshots" ADD CONSTRAINT "FK_43c6129064760226d640b119266" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reputation_index_snapshots" ADD CONSTRAINT "FK_e6729cef55b0e80b6b01d498f7e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reputation_index_snapshots" ADD CONSTRAINT "FK_502ffed60fb52800123d4ff9129" FOREIGN KEY ("tramo_id") REFERENCES "tramos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reputation_index_snapshots" ADD CONSTRAINT "FK_5fe18d332b3a16b17c79d709f38" FOREIGN KEY ("algorithm_version_id") REFERENCES "ic_algorithm_versions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evidence_versions" ADD CONSTRAINT "FK_106ef80e1a6f98949d6d8bbc99e" FOREIGN KEY ("evidence_id") REFERENCES "evidences"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evidence_versions" ADD CONSTRAINT "FK_1af81cc859fc7e3af33789735c3" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluation_ai_results" ADD CONSTRAINT "FK_3d2e4caa670ca397da1e3c39333" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluation_ai_results" ADD CONSTRAINT "FK_af6a63c5ffbe4231e443cba4833" FOREIGN KEY ("rubric_id") REFERENCES "rubrics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluation_human_reviews" ADD CONSTRAINT "FK_8e7d5d1475798725fba41d4d4f8" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluation_human_reviews" ADD CONSTRAINT "FK_03c4e363c4e6089b52e681280da" FOREIGN KEY ("reviewer_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" ADD CONSTRAINT "FK_2ee372651b070811175d00b0902" FOREIGN KEY ("evidence_id") REFERENCES "evidences"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" ADD CONSTRAINT "FK_960808e5b4155ad9cc3a08375f8" FOREIGN KEY ("rubric_id") REFERENCES "rubrics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evidences" ADD CONSTRAINT "FK_103e9291d499d50dc0459282279" FOREIGN KEY ("micro_action_instance_id") REFERENCES "micro_action_instances"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evidences" ADD CONSTRAINT "FK_d8632ec5f3783ffaafa5ae381e9" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evidences" ADD CONSTRAINT "FK_fa2c21ce5ccf437443cf9cbb82e" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evidences" ADD CONSTRAINT "FK_96dcd3aadbbdd7ac09d3e5022cb" FOREIGN KEY ("validated_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "micro_action_instances" ADD CONSTRAINT "FK_1c35ac6d15f60aea34ec3885bb1" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "micro_action_instances" ADD CONSTRAINT "FK_fbf4b10cf5495892c898fa10e79" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "micro_action_instances" ADD CONSTRAINT "FK_c4430f58f65802c86ab2015866d" FOREIGN KEY ("micro_action_definition_id") REFERENCES "micro_action_definitions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "upload_sessions" ADD CONSTRAINT "FK_618744671a11fde87197271fd73" FOREIGN KEY ("evidence_id") REFERENCES "evidences"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "upload_sessions" ADD CONSTRAINT "FK_6f29ba9019abad2ea18a1aea4a2" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "upload_sessions" ADD CONSTRAINT "FK_22fe2076ddc191c6d14180e96d5" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "digital_credentials" ADD CONSTRAINT "FK_93a29a13b6f0c168745d9a7dd6d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "digital_credentials" ADD CONSTRAINT "FK_48dc8bff8e2a9665a57c0cf06ef" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "digital_credentials" ADD CONSTRAINT "FK_124d209b3bf3d407ac286955eab" FOREIGN KEY ("evidence_id") REFERENCES "evidences"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "digital_credentials" ADD CONSTRAINT "FK_1ff71898081116efa7c6b3631ce" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dim_pacs" ADD CONSTRAINT "FK_fe3098111a63247b991c8c3befb" FOREIGN KEY ("pac_id") REFERENCES "pacs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dim_pacs" ADD CONSTRAINT "FK_6757efe2cf0a446919b5f5c3ad8" FOREIGN KEY ("category_id") REFERENCES "dim_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dim_categories" ADD CONSTRAINT "FK_d0ea6180de88417457da1857650" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dim_categories" ADD CONSTRAINT "FK_f2a64ab1d68090686c3f1757292" FOREIGN KEY ("tramo_id") REFERENCES "dim_tramos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_sustainability_signals" ADD CONSTRAINT "FK_0459a6644a2fc0c4f56da15fa43" FOREIGN KEY ("project_id") REFERENCES "dim_projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_sustainability_signals" ADD CONSTRAINT "FK_3f066d771d4303bc87f7e6a03d4" FOREIGN KEY ("tramo_id") REFERENCES "dim_tramos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dim_tramos" ADD CONSTRAINT "FK_983e2a8949e1bb283ac032fbf1c" FOREIGN KEY ("tramo_id") REFERENCES "tramos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_project_activities" ADD CONSTRAINT "FK_b19e120feda47a17e3d86b4616f" FOREIGN KEY ("project_id") REFERENCES "dim_projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_project_activities" ADD CONSTRAINT "FK_a1135e2dad03373c38ca815afcc" FOREIGN KEY ("tramo_id") REFERENCES "dim_tramos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_project_activities" ADD CONSTRAINT "FK_ae7905aa31182c8463b2c7f62b9" FOREIGN KEY ("pac_id") REFERENCES "dim_pacs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_collaboration_impacts" ADD CONSTRAINT "FK_7e7072c7319ac7bb54543fc48c5" FOREIGN KEY ("project_id") REFERENCES "dim_projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_skill_signals" ADD CONSTRAINT "FK_3c57e45f8d3ee7e265faebbdc30" FOREIGN KEY ("project_id") REFERENCES "dim_projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_skill_signals" ADD CONSTRAINT "FK_18671353e51176a3e368e6e6de1" FOREIGN KEY ("user_id") REFERENCES "dim_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_skill_signals" ADD CONSTRAINT "FK_94668f09f509c8099b6ea0b7107" FOREIGN KEY ("source_evidence_id") REFERENCES "evidences"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dim_users" ADD CONSTRAINT "FK_3d80e7e0e24c673627f0eaee4ad" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_competency_signals" ADD CONSTRAINT "FK_a34c445fc9ece88f32f80132921" FOREIGN KEY ("project_id") REFERENCES "dim_projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_competency_signals" ADD CONSTRAINT "FK_d6331305d3863c08c917ae2f5c6" FOREIGN KEY ("user_id") REFERENCES "dim_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_competency_signals" ADD CONSTRAINT "FK_0cbe0efe970f3c24ffdd3ca31b4" FOREIGN KEY ("source_evidence_id") REFERENCES "evidences"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dim_projects" ADD CONSTRAINT "FK_7d2a730dc97bbee74d2b2dfa801" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_validated_evidences" ADD CONSTRAINT "FK_8d8616da57663e076c13e6ebd2e" FOREIGN KEY ("project_id") REFERENCES "dim_projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_validated_evidences" ADD CONSTRAINT "FK_1b3843a083be3a110b964f518e0" FOREIGN KEY ("tramo_id") REFERENCES "dim_tramos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dim_algorithm_versions" ADD CONSTRAINT "FK_31c6774bb3d274473559a8a572a" FOREIGN KEY ("algorithm_version_id") REFERENCES "ic_algorithm_versions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dim_algorithm_versions" DROP CONSTRAINT "FK_31c6774bb3d274473559a8a572a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_validated_evidences" DROP CONSTRAINT "FK_1b3843a083be3a110b964f518e0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_validated_evidences" DROP CONSTRAINT "FK_8d8616da57663e076c13e6ebd2e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dim_projects" DROP CONSTRAINT "FK_7d2a730dc97bbee74d2b2dfa801"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_competency_signals" DROP CONSTRAINT "FK_0cbe0efe970f3c24ffdd3ca31b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_competency_signals" DROP CONSTRAINT "FK_d6331305d3863c08c917ae2f5c6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_competency_signals" DROP CONSTRAINT "FK_a34c445fc9ece88f32f80132921"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dim_users" DROP CONSTRAINT "FK_3d80e7e0e24c673627f0eaee4ad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_skill_signals" DROP CONSTRAINT "FK_94668f09f509c8099b6ea0b7107"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_skill_signals" DROP CONSTRAINT "FK_18671353e51176a3e368e6e6de1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_skill_signals" DROP CONSTRAINT "FK_3c57e45f8d3ee7e265faebbdc30"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_collaboration_impacts" DROP CONSTRAINT "FK_7e7072c7319ac7bb54543fc48c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_project_activities" DROP CONSTRAINT "FK_ae7905aa31182c8463b2c7f62b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_project_activities" DROP CONSTRAINT "FK_a1135e2dad03373c38ca815afcc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_project_activities" DROP CONSTRAINT "FK_b19e120feda47a17e3d86b4616f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dim_tramos" DROP CONSTRAINT "FK_983e2a8949e1bb283ac032fbf1c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_sustainability_signals" DROP CONSTRAINT "FK_3f066d771d4303bc87f7e6a03d4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fact_sustainability_signals" DROP CONSTRAINT "FK_0459a6644a2fc0c4f56da15fa43"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dim_categories" DROP CONSTRAINT "FK_f2a64ab1d68090686c3f1757292"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dim_categories" DROP CONSTRAINT "FK_d0ea6180de88417457da1857650"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dim_pacs" DROP CONSTRAINT "FK_6757efe2cf0a446919b5f5c3ad8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dim_pacs" DROP CONSTRAINT "FK_fe3098111a63247b991c8c3befb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "digital_credentials" DROP CONSTRAINT "FK_1ff71898081116efa7c6b3631ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "digital_credentials" DROP CONSTRAINT "FK_124d209b3bf3d407ac286955eab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "digital_credentials" DROP CONSTRAINT "FK_48dc8bff8e2a9665a57c0cf06ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "digital_credentials" DROP CONSTRAINT "FK_93a29a13b6f0c168745d9a7dd6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "upload_sessions" DROP CONSTRAINT "FK_22fe2076ddc191c6d14180e96d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "upload_sessions" DROP CONSTRAINT "FK_6f29ba9019abad2ea18a1aea4a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "upload_sessions" DROP CONSTRAINT "FK_618744671a11fde87197271fd73"`,
    );
    await queryRunner.query(
      `ALTER TABLE "micro_action_instances" DROP CONSTRAINT "FK_c4430f58f65802c86ab2015866d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "micro_action_instances" DROP CONSTRAINT "FK_fbf4b10cf5495892c898fa10e79"`,
    );
    await queryRunner.query(
      `ALTER TABLE "micro_action_instances" DROP CONSTRAINT "FK_1c35ac6d15f60aea34ec3885bb1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evidences" DROP CONSTRAINT "FK_96dcd3aadbbdd7ac09d3e5022cb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evidences" DROP CONSTRAINT "FK_fa2c21ce5ccf437443cf9cbb82e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evidences" DROP CONSTRAINT "FK_d8632ec5f3783ffaafa5ae381e9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evidences" DROP CONSTRAINT "FK_103e9291d499d50dc0459282279"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" DROP CONSTRAINT "FK_960808e5b4155ad9cc3a08375f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" DROP CONSTRAINT "FK_2ee372651b070811175d00b0902"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluation_human_reviews" DROP CONSTRAINT "FK_03c4e363c4e6089b52e681280da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluation_human_reviews" DROP CONSTRAINT "FK_8e7d5d1475798725fba41d4d4f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluation_ai_results" DROP CONSTRAINT "FK_af6a63c5ffbe4231e443cba4833"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluation_ai_results" DROP CONSTRAINT "FK_3d2e4caa670ca397da1e3c39333"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evidence_versions" DROP CONSTRAINT "FK_1af81cc859fc7e3af33789735c3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evidence_versions" DROP CONSTRAINT "FK_106ef80e1a6f98949d6d8bbc99e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reputation_index_snapshots" DROP CONSTRAINT "FK_5fe18d332b3a16b17c79d709f38"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reputation_index_snapshots" DROP CONSTRAINT "FK_502ffed60fb52800123d4ff9129"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reputation_index_snapshots" DROP CONSTRAINT "FK_e6729cef55b0e80b6b01d498f7e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reputation_index_snapshots" DROP CONSTRAINT "FK_43c6129064760226d640b119266"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reputation_index_explanations" DROP CONSTRAINT "FK_22aed8ea93340ab4d0cb72a1d0d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_tramo_history" DROP CONSTRAINT "FK_9957773b04636534c9b1123f777"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_tramo_history" DROP CONSTRAINT "FK_6ed0770c8164afad1b22cef90e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nft_actors" DROP CONSTRAINT "FK_20ed50ded09c96b2b4db397fdcc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_03c82619d37f3e241bc77cbcca5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_6a40ca0781a8e93d750f07b5659"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_pacs" DROP CONSTRAINT "FK_1f7a5c272789d671918aa63502d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_pacs" DROP CONSTRAINT "FK_31f196e52d4738556d6b38fb7cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_f3a3e3b32b8e9d8ca850e217fd6"`,
    );
    await queryRunner.query(`ALTER TABLE "pacs" DROP CONSTRAINT "FK_421465d524473695bbd63a99f71"`);
    await queryRunner.query(
      `ALTER TABLE "micro_action_definitions" DROP CONSTRAINT "FK_ef8d2fc547bbb46d0d59e47b482"`,
    );
    await queryRunner.query(
      `ALTER TABLE "micro_action_definitions" DROP CONSTRAINT "FK_9885e5778a9e81378ab7dec2b81"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_resources" DROP CONSTRAINT "FK_b03123d9184d200a4a475df5f64"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_resources" DROP CONSTRAINT "FK_1248dda687764c10b33c72377bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nft_projects" DROP CONSTRAINT "FK_187e0d99002d208c34e17649115"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nft_projects" DROP CONSTRAINT "FK_cae0319f055a18c8a8071acc14c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nft_ownership_events" DROP CONSTRAINT "FK_6734373e8e84779a2edf779cad8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nft_ownership_events" DROP CONSTRAINT "FK_b01e4ae820d70ea0209b26021d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nft_ownership_events" DROP CONSTRAINT "FK_586b798170535dfeffdab9a8131"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mecenas_nft_portfolios" DROP CONSTRAINT "FK_e71a94a1d5493137c06c0003244"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mecenas_nft_portfolios" DROP CONSTRAINT "FK_c9d52c5d4d8938b791e54252e6b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mecenas_nft_portfolios" DROP CONSTRAINT "FK_543c144197995df6e38466a887a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" DROP CONSTRAINT "FK_e89aae80e010c2faa72e6a49ce8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" DROP CONSTRAINT "FK_b5729113570c20c7e214cf3f58d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_profiles" DROP CONSTRAINT "FK_e744d07363c9e6e7e543f811ec7"`,
    );
    await queryRunner.query(`DROP TABLE "dim_algorithm_versions"`);
    await queryRunner.query(`DROP TABLE "dim_time"`);
    await queryRunner.query(`DROP TABLE "fact_validated_evidences"`);
    await queryRunner.query(`DROP TABLE "dim_projects"`);
    await queryRunner.query(`DROP TABLE "fact_competency_signals"`);
    await queryRunner.query(`DROP TYPE "public"."fact_competency_signals_level_enum"`);
    await queryRunner.query(`DROP TABLE "dim_users"`);
    await queryRunner.query(`DROP TABLE "fact_skill_signals"`);
    await queryRunner.query(`DROP TYPE "public"."fact_skill_signals_level_enum"`);
    await queryRunner.query(`DROP TABLE "fact_collaboration_impacts"`);
    await queryRunner.query(`DROP TABLE "fact_project_activities"`);
    await queryRunner.query(`DROP TABLE "dim_tramos"`);
    await queryRunner.query(`DROP TABLE "fact_sustainability_signals"`);
    await queryRunner.query(`DROP TABLE "dim_categories"`);
    await queryRunner.query(`DROP TABLE "dim_pacs"`);
    await queryRunner.query(`DROP TABLE "digital_credentials"`);
    await queryRunner.query(`DROP TYPE "public"."digital_credentials_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."digital_credentials_credential_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b57cd853fa0be62fc9286af620"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f6fda64c27e38f600c6bc103d6"`);
    await queryRunner.query(`DROP TABLE "evidence_deletion_outbox"`);
    await queryRunner.query(`DROP TYPE "public"."evidence_deletion_outbox_status_enum"`);
    await queryRunner.query(`DROP TABLE "upload_sessions"`);
    await queryRunner.query(`DROP TABLE "micro_action_instances"`);
    await queryRunner.query(`DROP TYPE "public"."micro_action_instances_status_enum"`);
    await queryRunner.query(`DROP TABLE "evidences"`);
    await queryRunner.query(`DROP TYPE "public"."evidences_privacy_level_enum"`);
    await queryRunner.query(`DROP TYPE "public"."evidences_validation_confidence_enum"`);
    await queryRunner.query(`DROP TYPE "public"."evidences_validation_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."evidences_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."evidences_evidence_type_enum"`);
    await queryRunner.query(`DROP TABLE "evaluations"`);
    await queryRunner.query(`DROP TYPE "public"."evaluations_evaluation_result_enum"`);
    await queryRunner.query(`DROP TYPE "public"."evaluations_evaluation_type_enum"`);
    await queryRunner.query(`DROP TABLE "evaluation_human_reviews"`);
    await queryRunner.query(`DROP TYPE "public"."evaluation_human_reviews_review_decision_enum"`);
    await queryRunner.query(`DROP TABLE "evaluation_ai_results"`);
    await queryRunner.query(`DROP TYPE "public"."evaluation_ai_results_ai_result_enum"`);
    await queryRunner.query(`DROP TABLE "evidence_versions"`);
    await queryRunner.query(`DROP TABLE "reputation_index_snapshots"`);
    await queryRunner.query(
      `DROP TYPE "public"."reputation_index_snapshots_eligibility_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "reputation_index_explanations"`);
    await queryRunner.query(`DROP TABLE "ic_algorithm_versions"`);
    await queryRunner.query(`DROP TABLE "project_tramo_history"`);
    await queryRunner.query(`DROP TABLE "user_role_change_audits"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_provider_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "nft_actors"`);
    await queryRunner.query(`DROP TYPE "public"."nft_actors_actor_nft_type_enum"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TYPE "public"."projects_trajectory_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."projects_status_enum"`);
    await queryRunner.query(`DROP TABLE "project_pacs"`);
    await queryRunner.query(`DROP TYPE "public"."project_pacs_status_enum"`);
    await queryRunner.query(`DROP TABLE "tramos"`);
    await queryRunner.query(`DROP TYPE "public"."tramos_primary_risk_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tramos_uncertainty_type_enum"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TYPE "public"."categories_primary_risk_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."categories_uncertainty_type_enum"`);
    await queryRunner.query(`DROP TABLE "pacs"`);
    await queryRunner.query(`DROP TABLE "micro_action_definitions"`);
    await queryRunner.query(
      `DROP TYPE "public"."micro_action_definitions_expected_evidence_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."micro_action_definitions_micro_action_type_enum"`);
    await queryRunner.query(`DROP TABLE "rubrics"`);
    await queryRunner.query(`DROP TYPE "public"."rubrics_target_entity_enum"`);
    await queryRunner.query(`DROP TABLE "learning_resources"`);
    await queryRunner.query(`DROP TYPE "public"."learning_resources_resource_type_enum"`);
    await queryRunner.query(`DROP TABLE "nft_projects"`);
    await queryRunner.query(`DROP TABLE "nft_ownership_events"`);
    await queryRunner.query(`DROP TYPE "public"."nft_ownership_events_event_type_enum"`);
    await queryRunner.query(`DROP TABLE "mecenas_nft_portfolios"`);
    await queryRunner.query(`DROP TYPE "public"."mecenas_nft_portfolios_portfolio_role_enum"`);
    await queryRunner.query(`DROP TABLE "project_members"`);
    await queryRunner.query(`DROP TYPE "public"."project_members_role_in_team_enum"`);
    await queryRunner.query(`DROP TYPE "public"."project_members_gender_enum"`);
    await queryRunner.query(`DROP TABLE "project_profiles"`);
  }
}
