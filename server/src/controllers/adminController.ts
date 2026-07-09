import { Request, Response } from 'express';
import prisma from '../config/db';

/**
 * 1. AGENT MANAGEMENT
 */
export const getAgents = async (req: Request, res: Response) => {
  try {
    const agents = await prisma.user.findMany({
      where: { role: 'FIELD_AGENT' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        branch: true,
        createdAt: true,
        assignedCases: {
          select: { id: true, status: true }
        }
      }
    });
    res.status(200).json({ success: true, data: agents });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * 2. CUSTOMER & CASE MANAGEMENT
 */
export const createCustomerAndCase = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, address, loanAmount, businessName, type } = req.body;
    
    // Create customer and automatically create a pending case
    const customer = await prisma.customer.create({
      data: {
        applicationId: `APP-${Date.now()}`,
        firstName,
        lastName,
        email,
        phone,
        address,
        loanAmount,
        businessName,
        verificationCases: {
          create: {
            type: type || 'RESIDENTIAL',
            status: 'PENDING'
          }
        }
      },
      include: {
        verificationCases: true
      }
    });

    res.status(201).json({ success: true, message: 'Customer and pending case created successfully', data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getCases = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    const cases = await prisma.verificationCase.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        customer: true,
        agent: {
          select: { id: true, firstName: true, lastName: true }
        },
        media: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.status(200).json({ success: true, data: cases });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const assignCase = async (req: Request, res: Response) => {
  try {
    const { caseId } = req.params;
    const { agentId } = req.body;

    // Verify agent exists
    const agent = await prisma.user.findUnique({ where: { id: agentId, role: 'FIELD_AGENT' } });
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Field Agent not found' });
    }

    const updatedCase = await prisma.verificationCase.update({
      where: { id: caseId },
      data: {
        agentId,
        status: 'ASSIGNED'
      }
    });

    res.status(200).json({ success: true, message: 'Case assigned successfully', data: updatedCase });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * 3. VERIFICATION REVIEW
 */
export const updateCaseStatus = async (req: Request, res: Response) => {
  try {
    const { caseId } = req.params;
    const { status } = req.body; // e.g., COMPLETED or REJECTED

    if (!['COMPLETED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update' });
    }

    const updatedCase = await prisma.verificationCase.update({
      where: { id: caseId },
      data: { 
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null
      }
    });

    res.status(200).json({ success: true, message: `Case marked as ${status}`, data: updatedCase });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * 4. DASHBOARD ANALYTICS
 */
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const totalAgents = await prisma.user.count({ where: { role: 'FIELD_AGENT' } });
    const totalCustomers = await prisma.customer.count();
    
    const casesByStatus = await prisma.verificationCase.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    const analytics = {
      totalAgents,
      totalCustomers,
      caseBreakdown: casesByStatus.map(c => ({
        status: c.status,
        count: c._count.status
      }))
    };

    res.status(200).json({ success: true, data: analytics });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
