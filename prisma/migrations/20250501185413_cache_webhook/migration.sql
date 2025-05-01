-- CreateTable
CREATE TABLE "MessageCache" (
    "id" TEXT NOT NULL,
    "discord_msg_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB,
    "embeds" JSONB,
    "reactions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MessageCache_discord_msg_id_key" ON "MessageCache"("discord_msg_id");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_event_id_key" ON "WebhookEvent"("event_id");

-- AddForeignKey
ALTER TABLE "MessageCache" ADD CONSTRAINT "MessageCache_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "discord_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
