CREATE TYPE "OrderStatus" AS ENUM ('PROTOCOLLED', 'UNDER_REVIEW', 'PENDING_REQUIREMENTS', 'COMPLETED', 'CANCELED');
CREATE TYPE "OrderPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

CREATE TABLE "request_types" (
  "id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "slug" VARCHAR(100) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "request_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_orders" (
  "id" UUID NOT NULL,
  "protocol" VARCHAR(11) NOT NULL,
  "protocol_year" INTEGER NOT NULL,
  "sequence" INTEGER NOT NULL,
  "request_type_id" UUID NOT NULL,
  "applicant" VARCHAR(150) NOT NULL,
  "description" TEXT NOT NULL,
  "priority" "OrderPriority" NOT NULL DEFAULT 'NORMAL',
  "status" "OrderStatus" NOT NULL DEFAULT 'PROTOCOLLED',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_transitions" (
  "id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "from_status" "OrderStatus" NOT NULL,
  "to_status" "OrderStatus" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_transitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "protocol_counters" (
  "year" INTEGER NOT NULL,
  "last_sequence" INTEGER NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "protocol_counters_pkey" PRIMARY KEY ("year")
);

CREATE UNIQUE INDEX "request_types_name_key" ON "request_types"("name");
CREATE UNIQUE INDEX "request_types_slug_key" ON "request_types"("slug");
CREATE UNIQUE INDEX "service_orders_protocol_key" ON "service_orders"("protocol");
CREATE UNIQUE INDEX "service_orders_protocol_year_sequence_key" ON "service_orders"("protocol_year", "sequence");
CREATE INDEX "service_orders_status_idx" ON "service_orders"("status");
CREATE INDEX "service_orders_request_type_id_idx" ON "service_orders"("request_type_id");
CREATE INDEX "service_orders_created_at_idx" ON "service_orders"("created_at");
CREATE INDEX "order_transitions_order_id_created_at_idx" ON "order_transitions"("order_id", "created_at");

ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_request_type_id_fkey"
  FOREIGN KEY ("request_type_id") REFERENCES "request_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_transitions" ADD CONSTRAINT "order_transitions_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

