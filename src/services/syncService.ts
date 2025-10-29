import axios from "axios";
import { Database } from "../db/database";
import { TaskService } from "./taskService";

export class SyncService {
  private taskService: TaskService;

  constructor(private db: Database) {
    this.taskService = new TaskService(db);
  }

  async enqueueTask(taskId: string) {
    await this.db.run(`INSERT INTO sync_queue (task_id, status, created_at) VALUES (?, 'pending', CURRENT_TIMESTAMP)`, [taskId]);
  }

  async processQueue() {
    const queueItems = await this.db.all("SELECT * FROM sync_queue WHERE status = 'pending'");
    for (const item of queueItems) {
      try {
        const task = await this.taskService.getTaskById(item.task_id);
        if (!task) continue;

        // Simulate sending to remote API (success assumed)
        await axios.post("https://jsonplaceholder.typicode.com/todos", task);

        await this.db.run(
          "UPDATE sync_queue SET status = 'done', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [item.id]
        );
        await this.db.run(
          "UPDATE tasks SET sync_status = 'synced', last_synced_at = CURRENT_TIMESTAMP WHERE id = ?",
          [item.task_id]
        );
      } catch (error) {
        await this.db.run(
          "UPDATE sync_queue SET status = 'error', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [item.id]
        );
      }
    }
  }
}
