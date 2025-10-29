import { v4 as uuidv4 } from "uuid";
import { Database } from "../db/database";

export class TaskService {
  constructor(private db: Database) {}

  async getAllTasks() {
    return await this.db.all("SELECT * FROM tasks WHERE is_deleted = 0 ORDER BY updated_at DESC");
  }

  async getTaskById(id: string) {
    return await this.db.get("SELECT * FROM tasks WHERE id = ? AND is_deleted = 0", [id]);
  }

  async createTask(data: { title: string; description?: string }) {
    const id = uuidv4();
    const now = new Date().toISOString();
    await this.db.run(
      `INSERT INTO tasks (id, title, description, completed, is_deleted, sync_status, created_at, updated_at)
       VALUES (?, ?, ?, 0, 0, 'pending', ?, ?)`,
      [id, data.title, data.description ?? "", now, now]
    );
    return await this.getTaskById(id);
  }

  async updateTask(id: string, updates: { title?: string; description?: string; completed?: boolean }) {
    const task = await this.getTaskById(id);
    if (!task) throw new Error("Task not found");

    const title = updates.title ?? task.title;
    const description = updates.description ?? task.description;
    const completed = typeof updates.completed === "boolean" ? (updates.completed ? 1 : 0) : task.completed;

    await this.db.run(
      `UPDATE tasks SET title = ?, description = ?, completed = ?, sync_status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [title, description, completed, id]
    );
    return await this.getTaskById(id);
  }

  async deleteTask(id: string) {
    const task = await this.getTaskById(id);
    if (!task) throw new Error("Task not found");
    await this.db.run(`UPDATE tasks SET is_deleted = 1, sync_status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
    return { message: "Task deleted" };
  }

  async getPendingTasks() {
    return await this.db.all(`SELECT * FROM tasks WHERE sync_status = 'pending' AND is_deleted = 0`);
  }
}
