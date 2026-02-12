import { AuditLog, Notification } from "../models/domain.js";

export class BaseDomainService {
  static logAction({ actorId, action, entityType, entityId, payload }) {
    return AuditLog.create({
      actor_id: actorId || null,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      payload: payload ? JSON.stringify(payload) : null
    });
  }

  static notify({ userId, title, body }) {
    return Notification.create({ user_id: userId, title, body });
  }
}
