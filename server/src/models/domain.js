import { BaseModel } from "./BaseModel.js";

export class Permission extends BaseModel {
  static get table() {
    return "permissions";
  }

  static get primaryKey() {
    return "key";
  }
}

export class Role extends BaseModel {
  static get table() {
    return "roles";
  }

  permissions() {
    return Role.db
      .prepare("SELECT p.* FROM permissions p INNER JOIN role_permissions rp ON rp.permission_key = p.key WHERE rp.role_id = ?")
      .all(this.attributes.id);
  }

  syncPermissions(permissionKeys = []) {
    Role.db.exec("BEGIN");
    try {
      Role.db.prepare("DELETE FROM role_permissions WHERE role_id = ?").run(this.attributes.id);
      const stmt = Role.db.prepare("INSERT OR IGNORE INTO role_permissions(role_id, permission_key) VALUES(?, ?)");
      permissionKeys.forEach(key => stmt.run(this.attributes.id, key));
      Role.db.exec("COMMIT");
    } catch (error) {
      Role.db.exec("ROLLBACK");
      throw error;
    }
    return this;
  }
}

export class User extends BaseModel {
  static get table() {
    return "users";
  }

  role() {
    return Role.find(this.attributes.role_id);
  }

  assignRole(roleId) {
    return this.update({ role_id: roleId, updated_at: new Date().toISOString() });
  }

  directPermissions() {
    return User.db
      .prepare("SELECT p.* FROM permissions p INNER JOIN user_permissions up ON up.permission_key = p.key WHERE up.user_id = ?")
      .all(this.attributes.id);
  }

  syncPermissions(permissionKeys = []) {
    User.db.exec("BEGIN");
    try {
      User.db.prepare("DELETE FROM user_permissions WHERE user_id = ?").run(this.attributes.id);
      const stmt = User.db.prepare("INSERT OR IGNORE INTO user_permissions(user_id, permission_key) VALUES(?, ?)");
      permissionKeys.forEach(key => stmt.run(this.attributes.id, key));
      User.db.exec("COMMIT");
    } catch (error) {
      User.db.exec("ROLLBACK");
      throw error;
    }
    return this;
  }
}

export class OtpToken extends BaseModel {
  static get table() {
    return "otp_tokens";
  }
}

export class Policy extends BaseModel { static get table() { return "policies"; } }
export class Claim extends BaseModel { static get table() { return "claims"; } }
export class ClaimDocument extends BaseModel { static get table() { return "claim_documents"; } }
export class Message extends BaseModel { static get table() { return "messages"; } }
export class Project extends BaseModel { static get table() { return "projects"; } }
export class ProjectTask extends BaseModel { static get table() { return "project_tasks"; } }
export class PurchaseOrder extends BaseModel { static get table() { return "purchase_orders"; } }
export class PoLine extends BaseModel { static get table() { return "po_lines"; } }
export class FundingRequest extends BaseModel { static get table() { return "funding_requests"; } }
export class Approval extends BaseModel { static get table() { return "approvals"; } }
export class AuditLog extends BaseModel { static get table() { return "audit_logs"; } }
export class Notification extends BaseModel { static get table() { return "notifications"; } }
export class Invoice extends BaseModel { static get table() { return "invoices"; } }
export class InvoiceLine extends BaseModel { static get table() { return "invoice_lines"; } }
export class Payment extends BaseModel { static get table() { return "payments"; } }
export class LedgerEntry extends BaseModel { static get table() { return "ledgers"; } }
export class Share extends BaseModel { static get table() { return "shares"; } }
export class NextOfKin extends BaseModel { static get table() { return "next_of_kin"; } }
