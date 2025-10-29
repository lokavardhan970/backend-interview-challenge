import express from "express";
import { Database } from "../db/database";
import { TaskService } from "../services/taskService";
import { SyncService } from "../services/syncService";

export function createTaskRouter(db: Database) {
  const router = express.Router();
  const taskService = new TaskService(db);
  const syncService = new SyncService(db);

  // GET all tasks
  router.get("/", async (req, res) => {
    try {
      const tasks = await taskService.getAllTasks();
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET single task
  router.get("/:id", async (req, res) => {
    try {
      const task = await taskService.getTaskById(req.params.id);
      if (!task) return res.status(404).json({ error: "Task not found" });
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // CREATE new task
  router.post("/", async (req, res) => {
    try {
      const task = await taskService.createTask(req.body);
      await syncService.enqueueTask(task.id);
      res.status(201).json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // UPDATE task
  router.put("/:id", async (req, res) => {
    try {
      const updated = await taskService.updateTask(req.params.id, req.body);
      await syncService.enqueueTask(req.params.id);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // DELETE task
  router.delete("/:id", async (req, res) => {
    try {
      const result = await taskService.deleteTask(req.params.id);
      await syncService.enqueueTask(req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}
