import { Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middlewares/auth';
import { apiError } from '../../utils/helpers';

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const requester = await prisma.user.findUnique({ where: { id: adminId } });
    const isSuperAdmin = requester && (requester.email === 'akshaya@gmail.com' || requester.email === 'adarshaldkar@gmail.com');

    const logs = await (prisma.auditLog as any).findMany({
      where: isSuperAdmin ? {} : { adminId },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all users to map UUID to user name / email
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true, role: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // Fetch all cases to map case UUID to application ID / customer name
    const cases = await prisma.verificationCase.findMany({
      select: {
        id: true,
        customer: {
          select: {
            applicationId: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    const caseMap = new Map(cases.map(c => [c.id, c]));

    const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;

    const formattedLogs = logs.map((log: any) => {
      let formattedActor = log.actor;
      const actorUuidMatches = log.actor.match(uuidRegex);
      if (actorUuidMatches) {
        const uuid = actorUuidMatches[0];
        const user = userMap.get(uuid);
        if (user) {
          const roleLabel = user.role === 'ADMIN' ? 'Admin' : user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Agent';
          formattedActor = `${roleLabel} (${user.firstName} ${user.lastName})`;
        }
      }

      // Format Action
      let formattedAction = log.action;
      const lowerAction = log.action.toLowerCase();
      if (lowerAction === 'case needs_revision') {
        formattedAction = 'Needs Revision';
      } else if (lowerAction === 'case rejected') {
        formattedAction = 'Case Rejected';
      } else if (lowerAction === 'case approved') {
        formattedAction = 'Case Approved';
      } else if (lowerAction === 'verification submitted') {
        formattedAction = 'Verification Submitted';
      } else if (lowerAction.startsWith('case status updated to ')) {
        const status = log.action.replace(/case status updated to /i, '').toUpperCase();
        if (status === 'IN_PROGRESS') {
          formattedAction = 'Status set to In Progress';
        } else {
          formattedAction = `Status set to ${status.charAt(0) + status.slice(1).toLowerCase()}`;
        }
      } else {
        formattedAction = log.action.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      }

      // Format Entity
      let formattedEntity = log.entity;
      const entityUuidMatches = log.entity.match(uuidRegex);
      if (entityUuidMatches) {
        const uuid = entityUuidMatches[0];
        const caseObj = caseMap.get(uuid);
        if (caseObj && caseObj.customer) {
          const cust = caseObj.customer;
          formattedEntity = `Case: ${cust.firstName} ${cust.lastName} (${cust.applicationId})`;
        } else {
          formattedEntity = log.entity.replace(uuid, '').replace('Case  —', 'Case:').trim();
        }
      }

      return {
        ...log,
        actor: formattedActor,
        action: formattedAction,
        entity: formattedEntity
      };
    });

    return res.status(200).json({ success: true, data: formattedLogs });
  } catch (error: any) {
    return apiError(res, 'Failed to load audit logs', 500, error);
  }
};
