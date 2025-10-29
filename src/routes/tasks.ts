import express from "express";
import { Database } from "../db/database";
import { TaskService } from "../services/taskService";
import { SyncService } from "../services/syncService";

export function createTaskRouter(db: Database) {
  const router = express.Router();
  const taskService = new TaskService(db);
  const syncService = new SyncService(db);

  // 🟢 GET all tasks
  router.get("/", async (_req, res) => {
    try {
      const tasks = await taskService.getAllTasks();
      return res.json(tasks); // ✅ Always return
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // 🟢 GET single task by ID (added for completeness)
  router.get("/:id", async (req, res) => {
    try {
      const task = await taskService.getTaskById(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      return res.json(task);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // 🟢 CREATE task
  router.post("/", async (req, res) => {
    try {
      const task = await taskService.createTask(req.body);
      await syncService.enqueueTask(task.id);
      return res.status(201).json(task);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  });

  return router;
}
