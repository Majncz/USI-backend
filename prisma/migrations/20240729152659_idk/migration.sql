-- CreateTable
CREATE TABLE "usi_article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usi_article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usi_school" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "xCord" DOUBLE PRECISION NOT NULL,
    "yCord" DOUBLE PRECISION NOT NULL,
    "logoLink" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usi_school_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usi_image" (
    "id" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usi_image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usi_article_title_key" ON "usi_article"("title");
