CREATE TABLE "news_letter_opt_in" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_letter_opt_in_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "news_letter_opt_in_email_key" ON "news_letter_opt_in"("email");
