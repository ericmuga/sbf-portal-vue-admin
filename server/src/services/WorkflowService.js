import {
  Approval,
  Claim,
  ClaimDocument,
  FundingRequest,
  Invoice,
  InvoiceLine,
  LedgerEntry,
  Message,
  Payment,
  PoLine,
  ProjectTask,
  PurchaseOrder,
  Share,
  NextOfKin
} from "../models/domain.js";
import { BaseDomainService } from "./BaseDomainService.js";

export class WorkflowService extends BaseDomainService {
  static submitClaim({ actorId, payload }) {
    const claim = Claim.create({
      user_id: actorId,
      policy_no: payload.policyNo,
      type: payload.type,
      description: payload.description || "",
      amount: Number(payload.amount || 0)
    });
    this.logAction({ actorId, action: "claim.submitted", entityType: "claim", entityId: claim.toJSON().id, payload });
    return claim;
  }

  static uploadClaimDocument({ actorId, claimId, fileName, fileUrl }) {
    const doc = ClaimDocument.create({ claim_id: claimId, file_name: fileName, file_url: fileUrl || null });
    this.logAction({ actorId, action: "claim.document_uploaded", entityType: "claim_document", entityId: doc.toJSON().id, payload: { claimId, fileName } });
    return doc;
  }

  static sendMessage({ actorId, recipientId, body }) {
    const msg = Message.create({ sender_id: actorId, recipient_id: recipientId, body });
    this.notify({ userId: recipientId, title: "New Message", body });
    return msg;
  }

  static createPurchaseOrder({ actorId, payload }) {
    const po = PurchaseOrder.create(payload);
    this.logAction({ actorId, action: "po.created", entityType: "purchase_order", entityId: po.toJSON().id, payload });
    return po;
  }

  static addPoLine({ actorId, purchaseOrderId, payload }) {
    const line = PoLine.create({ purchase_order_id: purchaseOrderId, ...payload });
    this.logAction({ actorId, action: "po.line_added", entityType: "po_line", entityId: line.toJSON().id, payload });
    return line;
  }

  static createFundingRequest({ actorId, payload }) {
    const fr = FundingRequest.create({ ...payload, requested_by: actorId });
    this.logAction({ actorId, action: "funding.requested", entityType: "funding_request", entityId: fr.toJSON().id, payload });
    return fr;
  }

  static createProjectTask({ actorId, payload }) {
    const task = ProjectTask.create(payload);
    this.logAction({ actorId, action: "task.created", entityType: "project_task", entityId: task.toJSON().id, payload });
    return task;
  }

  static submitApproval({ actorId, payload }) {
    const approval = Approval.create({ ...payload, action_by: actorId });
    this.logAction({ actorId, action: "approval.submitted", entityType: payload.entity_type, entityId: payload.entity_id, payload });
    return approval;
  }

  static approveReject({ actorId, approvalId, status, note }) {
    const approval = Approval.find(approvalId);
    if (!approval) return null;
    approval.update({ status, action_by: actorId, action_note: note || null, updated_at: new Date().toISOString() });
    this.logAction({ actorId, action: `approval.${status}`, entityType: "approval", entityId: approvalId, payload: { note } });
    return approval;
  }

  static receivePayment({ actorId, payload }) {
    const payment = Payment.create(payload);
    LedgerEntry.create({ ledger_type: "customer", related_type: "payment", related_id: payment.toJSON().id, debit: 0, credit: payload.amount || 0, memo: "Payment received" });
    this.logAction({ actorId, action: "payment.received", entityType: "payment", entityId: payment.toJSON().id, payload });
    return payment;
  }

  static createInvoice({ actorId, payload }) {
    const invoice = Invoice.create(payload);
    this.logAction({ actorId, action: "invoice.created", entityType: "invoice", entityId: invoice.toJSON().id, payload });
    return invoice;
  }

  static addInvoiceLine({ actorId, invoiceId, payload }) {
    const line = InvoiceLine.create({ invoice_id: invoiceId, ...payload });
    this.logAction({ actorId, action: "invoice.line_added", entityType: "invoice_line", entityId: line.toJSON().id, payload });
    return line;
  }

  static subscribeShares({ actorId, quantity }) {
    const share = Share.create({ member_id: actorId, quantity, status: "active" });
    this.logAction({ actorId, action: "share.subscribed", entityType: "share", entityId: share.toJSON().id, payload: { quantity } });
    return share;
  }

  static maintainNextOfKin({ actorId, payload }) {
    const nok = NextOfKin.create({ user_id: actorId, ...payload });
    this.logAction({ actorId, action: "next_of_kin.added", entityType: "next_of_kin", entityId: nok.toJSON().id, payload });
    return nok;
  }
}
