-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'STUDENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'LOCKED', 'DISABLED');

-- CreateEnum
CREATE TYPE "AuthTokenType" AS ENUM ('ACTIVATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'PAYMENT_PENDING', 'AWAITING_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'COMPLETED', 'REJECTED', 'SUSPENDED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('PDF', 'VIDEO', 'AUDIO', 'IMAGE', 'SHEET_MUSIC', 'LINK');

-- CreateEnum
CREATE TYPE "ResourceVisibility" AS ENUM ('ENROLLED_ONLY', 'INSTRUCTORS_ONLY', 'PUBLIC_PREVIEW');

-- CreateEnum
CREATE TYPE "ClassSessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "BillingFrequency" AS ENUM ('MONTHLY', 'TERMLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('REGISTRATION', 'MONTHLY_TUITION', 'OTHER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'FAILED', 'CANCELLED', 'EXPIRED', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('PAYSTACK', 'HUBTEL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INITIALIZED', 'PENDING', 'SUCCESS', 'FAILED', 'ABANDONED', 'REVERSED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('SUBMITTED', 'LATE', 'REVIEWED', 'RESUBMIT_REQUESTED');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('THEORY', 'PRACTICAL', 'COMBINED');

-- CreateEnum
CREATE TYPE "LessonProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "mfa_secret" TEXT,
    "email_verified_at" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "replaced_by_token_id" UUID,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "AuthTokenType" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "student_number" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" DATE,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "emergency_contact_relationship" TEXT,
    "guardian_name" TEXT,
    "guardian_phone" TEXT,
    "guardian_email" TEXT,
    "guardian_consent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_number_counters" (
    "year" INTEGER NOT NULL,
    "last_sequence" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "student_number_counters_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "instructors" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "bio" TEXT,
    "qualifications" TEXT,
    "employment_status" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "instructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_instruments" (
    "instructor_id" UUID NOT NULL,
    "instrument_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instructor_instruments_pkey" PRIMARY KEY ("instructor_id","instrument_id")
);

-- CreateTable
CREATE TABLE "instruments" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "instruments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" UUID NOT NULL,
    "instrument_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "duration_weeks" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "level" "CourseLevel" NOT NULL DEFAULT 'BEGINNER',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sequence" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "objectives" TEXT,
    "content" TEXT,
    "sequence" INTEGER NOT NULL,
    "duration_minutes" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_resources" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "storage_key" TEXT,
    "external_url" TEXT,
    "mime_type" TEXT,
    "file_size_bytes" INTEGER,
    "visibility" "ResourceVisibility" NOT NULL DEFAULT 'ENROLLED_ONLY',
    "uploaded_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "learning_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "application_token_hash" TEXT NOT NULL,
    "student_id" UUID,
    "instrument_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "date_of_birth" DATE,
    "address" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "experience_level" TEXT,
    "goals" TEXT,
    "availability" TEXT,
    "consent_accepted_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PAYMENT_PENDING',
    "reviewer_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "decision_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "application_id" UUID,
    "program_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "instructor_id" UUID,
    "class_id" UUID,
    "fee_plan_id" UUID,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "enrolled_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "instrument_id" UUID NOT NULL,
    "level" "CourseLevel" NOT NULL DEFAULT 'BEGINNER',
    "instructor_id" UUID NOT NULL,
    "venue" TEXT NOT NULL,
    "room" TEXT,
    "capacity" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_sessions" (
    "id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "venue" TEXT NOT NULL,
    "room" TEXT,
    "status" "ClassSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "class_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" UUID NOT NULL,
    "class_session_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "marked_by_id" UUID NOT NULL,
    "notes" TEXT,
    "marked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_plans" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "instrument_id" UUID,
    "program_id" UUID,
    "level" "CourseLevel",
    "amount_pesewas" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "billing_frequency" "BillingFrequency" NOT NULL DEFAULT 'MONTHLY',
    "grace_period_days" INTEGER NOT NULL DEFAULT 7,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "fee_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "student_id" UUID,
    "application_id" UUID,
    "enrollment_id" UUID,
    "type" "InvoiceType" NOT NULL,
    "fee_plan_id" UUID,
    "invoice_number" TEXT NOT NULL,
    "amount_pesewas" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "billing_period" TEXT,
    "due_date" TIMESTAMPTZ(6) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "provider_reference" TEXT NOT NULL,
    "provider_event_id" TEXT,
    "amount_pesewas" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "channel" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'INITIALIZED',
    "raw_payload" JSONB,
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "instructor_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "due_at" TIMESTAMPTZ(6),
    "status" "AssignmentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "text" TEXT,
    "file_key" TEXT,
    "external_url" TEXT,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "feedback" TEXT,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "instructor_id" UUID NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "title" TEXT NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "max_score" DECIMAL(5,2) NOT NULL,
    "feedback" TEXT,
    "assessed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "status" "LessonProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMPTZ(6),
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "academy_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_token_hash_key" ON "auth_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "auth_tokens_user_id_type_idx" ON "auth_tokens"("user_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_student_number_key" ON "students"("student_number");

-- CreateIndex
CREATE INDEX "students_last_name_first_name_idx" ON "students"("last_name", "first_name");

-- CreateIndex
CREATE UNIQUE INDEX "instructors_user_id_key" ON "instructors"("user_id");

-- CreateIndex
CREATE INDEX "instructors_active_employment_status_idx" ON "instructors"("active", "employment_status");

-- CreateIndex
CREATE UNIQUE INDEX "instruments_name_key" ON "instruments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "instruments_slug_key" ON "instruments"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "programs_slug_key" ON "programs"("slug");

-- CreateIndex
CREATE INDEX "programs_instrument_id_active_idx" ON "programs"("instrument_id", "active");

-- CreateIndex
CREATE INDEX "courses_program_id_active_idx" ON "courses"("program_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "courses_program_id_sequence_key" ON "courses"("program_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "modules_course_id_sequence_key" ON "modules"("course_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_module_id_sequence_key" ON "lessons"("module_id", "sequence");

-- CreateIndex
CREATE INDEX "learning_resources_lesson_id_idx" ON "learning_resources"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_application_token_hash_key" ON "applications"("application_token_hash");

-- CreateIndex
CREATE INDEX "applications_email_status_idx" ON "applications"("email", "status");

-- CreateIndex
CREATE INDEX "applications_status_created_at_idx" ON "applications"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_application_id_key" ON "enrollments"("application_id");

-- CreateIndex
CREATE INDEX "enrollments_student_id_status_idx" ON "enrollments"("student_id", "status");

-- CreateIndex
CREATE INDEX "enrollments_class_id_status_idx" ON "enrollments"("class_id", "status");

-- CreateIndex
CREATE INDEX "enrollments_instructor_id_status_idx" ON "enrollments"("instructor_id", "status");

-- CreateIndex
CREATE INDEX "classes_instrument_id_active_idx" ON "classes"("instrument_id", "active");

-- CreateIndex
CREATE INDEX "classes_instructor_id_active_idx" ON "classes"("instructor_id", "active");

-- CreateIndex
CREATE INDEX "class_sessions_class_id_starts_at_idx" ON "class_sessions"("class_id", "starts_at");

-- CreateIndex
CREATE INDEX "attendances_student_id_idx" ON "attendances"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_class_session_id_student_id_key" ON "attendances"("class_session_id", "student_id");

-- CreateIndex
CREATE INDEX "fee_plans_active_idx" ON "fee_plans"("active");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_student_id_status_idx" ON "invoices"("student_id", "status");

-- CreateIndex
CREATE INDEX "invoices_application_id_idx" ON "invoices"("application_id");

-- CreateIndex
CREATE INDEX "invoices_status_due_date_idx" ON "invoices"("status", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_reference_key" ON "payments"("provider_reference");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_event_id_key" ON "payments"("provider_event_id");

-- CreateIndex
CREATE INDEX "payments_invoice_id_status_idx" ON "payments"("invoice_id", "status");

-- CreateIndex
CREATE INDEX "assignments_course_id_status_idx" ON "assignments"("course_id", "status");

-- CreateIndex
CREATE INDEX "submissions_student_id_idx" ON "submissions"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_assignment_id_student_id_key" ON "submissions"("assignment_id", "student_id");

-- CreateIndex
CREATE INDEX "assessments_enrollment_id_idx" ON "assessments"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_student_id_lesson_id_key" ON "lesson_progress"("student_id", "lesson_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_status_idx" ON "notifications"("user_id", "status");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "academy_settings_key_key" ON "academy_settings"("key");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_instruments" ADD CONSTRAINT "instructor_instruments_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_instruments" ADD CONSTRAINT "instructor_instruments_instrument_id_fkey" FOREIGN KEY ("instrument_id") REFERENCES "instruments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_instrument_id_fkey" FOREIGN KEY ("instrument_id") REFERENCES "instruments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_resources" ADD CONSTRAINT "learning_resources_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_resources" ADD CONSTRAINT "learning_resources_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_instrument_id_fkey" FOREIGN KEY ("instrument_id") REFERENCES "instruments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_fee_plan_id_fkey" FOREIGN KEY ("fee_plan_id") REFERENCES "fee_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_instrument_id_fkey" FOREIGN KEY ("instrument_id") REFERENCES "instruments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_class_session_id_fkey" FOREIGN KEY ("class_session_id") REFERENCES "class_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_marked_by_id_fkey" FOREIGN KEY ("marked_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_plans" ADD CONSTRAINT "fee_plans_instrument_id_fkey" FOREIGN KEY ("instrument_id") REFERENCES "instruments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_plans" ADD CONSTRAINT "fee_plans_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_fee_plan_id_fkey" FOREIGN KEY ("fee_plan_id") REFERENCES "fee_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_settings" ADD CONSTRAINT "academy_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
