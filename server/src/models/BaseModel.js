import db from "../db/database.js";

export class BaseModel {
  constructor(attributes = {}) {
    this.attributes = { ...attributes };
  }

  static get table() {
    throw new Error(`${this.name}.table is not implemented`);
  }

  static get primaryKey() {
    return "id";
  }

  static get db() {
    return db;
  }

  static from(record) {
    return record ? new this(record) : null;
  }

  static all() {
    const rows = this.db.prepare(`SELECT * FROM ${this.table}`).all();
    return rows.map(row => this.from(row));
  }

  static find(id) {
    const row = this.db
      .prepare(`SELECT * FROM ${this.table} WHERE ${this.primaryKey} = ? LIMIT 1`)
      .get(id);
    return this.from(row);
  }

  static where(criteria = {}) {
    const entries = Object.entries(criteria);
    if (!entries.length) return this.all();

    const whereClause = entries.map(([key]) => `${key} = ?`).join(" AND ");
    const values = entries.map(([, value]) => value);
    const rows = this.db.prepare(`SELECT * FROM ${this.table} WHERE ${whereClause}`).all(...values);
    return rows.map(row => this.from(row));
  }

  static create(payload = {}) {
    const keys = Object.keys(payload);
    const placeholders = keys.map(() => "?").join(", ");
    const values = keys.map(key => payload[key]);
    const sql = `INSERT INTO ${this.table} (${keys.join(", ")}) VALUES (${placeholders})`;
    const result = this.db.prepare(sql).run(...values);
    return this.find(result.lastInsertRowid);
  }

  update(payload = {}) {
    const keys = Object.keys(payload);
    if (!keys.length) return this;

    const setClause = keys.map(key => `${key} = ?`).join(", ");
    const values = keys.map(key => payload[key]);
    values.push(this.attributes[this.constructor.primaryKey]);

    this.constructor.db
      .prepare(`UPDATE ${this.constructor.table} SET ${setClause} WHERE ${this.constructor.primaryKey} = ?`)
      .run(...values);

    const fresh = this.constructor.find(this.attributes[this.constructor.primaryKey]);
    this.attributes = fresh?.toJSON() || this.attributes;
    return this;
  }

  toJSON() {
    return { ...this.attributes };
  }
}
