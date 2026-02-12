import db from "./database.js";

function seedPermissions() {
  const permissionKeys = [
    ["admin.access", "Access Admin Portal"],
    ["users.view", "View Users"],
    ["users.manage", "Manage Users"],
    ["roles.view", "View Roles"],
    ["roles.manage", "Manage Roles & Permissions"],
    ["payments.view", "View Payments"],
    ["payments.manage", "Manage Payments"],
    ["pos.view", "View Purchase Orders"],
    ["pos.manage", "Manage Purchase Orders"],
    ["projects.view", "View Projects"],
    ["projects.manage", "Manage Projects"],
    ["claims.manage", "Review Claims"],
    ["approvals.manage", "Manage Approval Workflow"],
    ["ledger.manage", "Manage Ledgers"],
    ["notifications.view", "View Notifications"]
  ];

  const insert = db.prepare("INSERT OR IGNORE INTO permissions(key, label) VALUES(?, ?)");
  for (const [key, label] of permissionKeys) insert.run(key, label);
}

function seedRolesAndUsers() {
  const roleExists = db.prepare("SELECT id FROM roles LIMIT 1").get();
  if (!roleExists) {
    db.prepare("INSERT INTO roles(name) VALUES (?), (?), (?), (?)").run("Admin", "Finance Officer", "Project Manager", "Member");
  }

  const usersCount = db.prepare("SELECT COUNT(*) count FROM users").get().count;
  if (!usersCount) {
    const stmt = db.prepare("INSERT INTO users(name, email, password_hash, role_id) VALUES(?, ?, ?, ?)");
    stmt.run("ERIC THEURI MUGA", "admin@sbf.test", "Pass123!", 1);
    stmt.run("Finance User", "finance@sbf.test", "Pass123!", 2);
    stmt.run("Project User", "pm@sbf.test", "Pass123!", 3);
    stmt.run("Member User", "member@sbf.test", "Pass123!", 4);
  }

  const rolePerm = db.prepare("INSERT OR IGNORE INTO role_permissions(role_id, permission_key) VALUES(?, ?)");
  const allPerms = db.prepare("SELECT key FROM permissions").all().map(x => x.key);
  allPerms.forEach(p => rolePerm.run(1, p));

  ["admin.access", "payments.view", "payments.manage", "pos.view", "pos.manage", "projects.view", "notifications.view"].forEach(p => rolePerm.run(2, p));
  ["admin.access", "projects.view", "projects.manage", "pos.view", "notifications.view"].forEach(p => rolePerm.run(3, p));

  const policyCount = db.prepare("SELECT COUNT(*) count FROM policies").get().count;
  if (!policyCount) {
    const stmt = db.prepare("INSERT INTO policies(policy_no, product, status, sum_assured, premium, period_from, period_to, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    stmt.run("026/CEA/125078", "USOMIBORA (LUMPSUM - LIMITED)", "PAID UP", 153502, 2005, "2018-02-16", "2031-02-16", 4);
    stmt.run("026/CEA/134514", "ENDOWMENT ASSURANCE WITH PROFITS (TermBased)", "ACTIVE", 212625, 2005, "2018-07-04", "2028-07-04", 4);
  }
}

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS permissions (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL,
      permission_key TEXT NOT NULL,
      PRIMARY KEY(role_id, permission_key),
      FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY(permission_key) REFERENCES permissions(key) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(role_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS user_permissions (
      user_id INTEGER NOT NULL,
      permission_key TEXT NOT NULL,
      PRIMARY KEY(user_id, permission_key),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(permission_key) REFERENCES permissions(key) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS otp_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_no TEXT NOT NULL UNIQUE,
      product TEXT NOT NULL,
      status TEXT NOT NULL,
      sum_assured REAL,
      premium REAL,
      period_from TEXT,
      period_to TEXT,
      user_id INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      policy_no TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      amount REAL DEFAULT 0,
      status TEXT DEFAULT 'SUBMITTED',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS claim_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claim_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(claim_id) REFERENCES claims(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER,
      recipient_id INTEGER,
      body TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      budget REAL DEFAULT 0,
      start_date TEXT,
      end_date TEXT
    );

    CREATE TABLE IF NOT EXISTS project_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      percentage_weight REAL DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      is_complete INTEGER DEFAULT 0,
      assigned_to INTEGER,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_number TEXT NOT NULL UNIQUE,
      vendor TEXT NOT NULL,
      project TEXT,
      status TEXT DEFAULT 'submitted',
      total REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS po_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_order_id INTEGER NOT NULL,
      line_description TEXT NOT NULL,
      qty REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      FOREIGN KEY(purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS funding_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      requested_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      action_by INTEGER,
      action_note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      payload TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      total REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoice_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      line_description TEXT NOT NULL,
      amount REAL DEFAULT 0,
      FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference TEXT NOT NULL,
      type TEXT NOT NULL,
      method TEXT NOT NULL,
      amount REAL DEFAULT 0,
      status TEXT DEFAULT 'posted',
      invoice_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(invoice_id) REFERENCES invoices(id)
    );

    CREATE TABLE IF NOT EXISTS ledgers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_type TEXT NOT NULL,
      related_type TEXT,
      related_id INTEGER,
      debit REAL DEFAULT 0,
      credit REAL DEFAULT 0,
      memo TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER,
      quantity REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS next_of_kin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      relationship TEXT,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  seedPermissions();
  seedRolesAndUsers();
}

export default db;
