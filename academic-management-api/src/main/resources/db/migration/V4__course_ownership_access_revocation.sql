-- Phase 18: access revocation cho enrollment (ADR-025, PRD-027)
-- access_revoked_at/access_revoked_reason chỉ được set qua POST /admin/enrollments/{id}/revoke-access.
alter table ENROLLMENTS
    add column access_revoked_at timestamp,
    add column access_revoked_reason text;
