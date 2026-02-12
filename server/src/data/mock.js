export const permissions = [
  { key: "admin.access", label: "Access Admin Portal" },
  { key: "users.view", label: "View Users" },
  { key: "users.manage", label: "Manage Users" },
  { key: "roles.view", label: "View Roles" },
  { key: "roles.manage", label: "Manage Roles & Permissions" },
  { key: "payments.view", label: "View Payments" },
  { key: "payments.manage", label: "Manage Payments" },
  { key: "pos.view", label: "View Purchase Orders" },
  { key: "pos.manage", label: "Manage Purchase Orders" },
  { key: "projects.view", label: "View Projects" },
  { key: "projects.manage", label: "Manage Projects" }
];

export const roles = [
  {
    id: 1,
    name: "Admin",
    permissions: permissions.map(p => p.key)
  },
  {
    id: 2,
    name: "Finance Officer",
    permissions: [
      "admin.access",
      "payments.view",
      "payments.manage",
      "pos.view",
      "pos.manage",
      "projects.view"
    ]
  },
  {
    id: 3,
    name: "Project Manager",
    permissions: [
      "admin.access",
      "projects.view",
      "projects.manage",
      "pos.view"
    ]
  },
  {
    id: 4,
    name: "Member",
    permissions: []
  }
];

export const users = [
  { id: 1, name: "ERIC THEURI MUGA", email: "admin@sbf.test", password: "Pass123!", roleId: 1, directPermissions: [] },
  { id: 2, name: "Finance User", email: "finance@sbf.test", password: "Pass123!", roleId: 2, directPermissions: [] },
  { id: 3, name: "Project User", email: "pm@sbf.test", password: "Pass123!", roleId: 3, directPermissions: [] },
  { id: 4, name: "Member User", email: "member@sbf.test", password: "Pass123!", roleId: 4, directPermissions: [] }
];

export function getRole(roleId) {
  return roles.find(r => r.id === roleId);
}

export function safeUser(u) {
  const role = getRole(u.roleId);
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: role ? { id: role.id, name: role.name } : null,
    directPermissions: u.directPermissions || [],
    permissions: [...new Set([...(role?.permissions || []), ...(u.directPermissions || [])])]
  };
}

// --- Portfolio (member-facing) ---
export const mockPolicies = [
  { id: 1, policyNo: "026/CEA/125078", product: "USOMIBORA (LUMPSUM - LIMITED)", status: "PAID UP", sumAssured: 153502, premium: 2005, periodFrom: "2018-02-16", periodTo: "2031-02-16" },
  { id: 2, policyNo: "026/CEA/134514", product: "ENDOWMENT ASSURANCE WITH PROFITS (TermBased)", status: "ACTIVE", sumAssured: 212625, premium: 2005, periodFrom: "2018-07-04", periodTo: "2028-07-04" },
  { id: 3, policyNo: "026/CEA/134516", product: "ENDOWMENT ASSURANCE", status: "ACTIVE", sumAssured: 180000, premium: 1800, periodFrom: "2019-01-10", periodTo: "2029-01-10" },
  { id: 4, policyNo: "026/CEA/160799", product: "ENDOWMENT ASSURANCE", status: "ACTIVE", sumAssured: 250000, premium: 2500, periodFrom: "2020-03-20", periodTo: "2030-03-20" }
];

export const beneficiariesByPolicy = {
  "026/CEA/125078": [
    { name: "CAROLINE MUMBI", relationship: "WIFE", idNumber: "N/A", kraPin: "N/A", share: 0.0, postal: "N/A", physical: "N/A" },
    { name: "KEVIN KAMAU", relationship: "BROTHER", idNumber: "N/A", kraPin: "N/A", share: 0.0, postal: "N/A", physical: "N/A" }
  ]
};

// --- Claims (end-to-end demo) ---
let claimId = 1;
export const claims = []; // {id, policyNo, type, description, amount, status, createdAt, docs:[]}

export function createClaim(payload) {
  const c = {
    id: claimId++,
    policyNo: payload.policyNo,
    type: payload.type,
    description: payload.description || "",
    amount: Number(payload.amount || 0),
    status: "SUBMITTED",
    createdAt: new Date().toISOString(),
    docs: payload.docs || []
  };
  claims.unshift(c);
  return c;
}

// --- Admin entities (demo) ---
let poId = 1;
export const purchaseOrders = [
  { id: poId++, poNumber: "PO-0001", vendor: "Acme Supplies", project: "Goat Rearing", status: "submitted", total: 120000, createdAt: new Date().toISOString() },
  { id: poId++, poNumber: "PO-0002", vendor: "Farm Feeds Ltd", project: "Export Program", status: "approved", total: 85000, createdAt: new Date().toISOString() }
];

let projId = 1;
export const projects = [
  { id: projId++, title: "Goat Rearing", status: "active", budget: 500000, startDate: "2026-01-10", endDate: "2026-06-30" },
  { id: projId++, title: "Export Program", status: "planned", budget: 1200000, startDate: "2026-03-01", endDate: "2026-12-31" }
];

export const projectTasksByProject = {
  1: [
    { id: 1, description: "Acquire breeding stock", percentageWeight: 20, startDate: "2026-01-10", endDate: "2026-01-31", isComplete: true, assignedTo: "Project User" },
    { id: 2, description: "Set up housing", percentageWeight: 30, startDate: "2026-02-01", endDate: "2026-02-20", isComplete: false, assignedTo: "Project User" }
  ]
};

let payId = 1;
export const payments = [
  { id: payId++, reference: "PAY-AB12", type: "customer", method: "mpesa", amount: 2005, status: "posted", createdAt: new Date().toISOString() },
  { id: payId++, reference: "VPAY-XY77", type: "vendor", method: "bank", amount: 85000, status: "posted", createdAt: new Date().toISOString() }
];
