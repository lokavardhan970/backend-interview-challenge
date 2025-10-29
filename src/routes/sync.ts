import express from "express";
import { Database } from "../db/database";
import { SyncService } from "../services/syncService";

export function createSyncRouter(db: Database) {
  const router = express.Router();
  const syncService = new SyncService(db);

  router.post("/process", async (_req, res) => {
    try {
      await syncService.processQueue();
      res.json({ message: "Sync completed successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
