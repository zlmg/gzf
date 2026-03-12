-- CreateTable
CREATE TABLE "Poi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "latitude" TEXT NOT NULL,
    "longitude" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Poi_latitude_longitude_category_key" ON "Poi"("latitude", "longitude", "category");
