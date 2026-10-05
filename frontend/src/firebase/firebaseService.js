/**
 * Synaptech AI - Firebase Unified Service Aggregator
 * 
 * Modular domain services:
 * - authService: User authentication, JWT issuance, profile updates
 * - projectRiskService: Project health telemetry, risk prediction, evaluation
 * - requirementService: ISO-25010 requirement analysis and storage
 * - traceabilityService: Traceability graph, blast radius calculation, what-if simulations
 * - aiEngineService: Sprint planning, architecture canvas, code review, AI Copilot
 * - adminService: User governance, RBAC role management, immutable audit logging
 */

import { authService } from './services/authService.js';
import { projectRiskService } from './services/projectRiskService.js';
import { requirementService } from './services/requirementService.js';
import { traceabilityService } from './services/traceabilityService.js';
import { aiEngineService } from './services/aiEngineService.js';
import { adminService } from './services/adminService.js';

export const firebaseService = {
  ...authService,
  ...projectRiskService,
  ...requirementService,
  ...traceabilityService,
  ...aiEngineService,
  ...adminService,
};

export {
  authService,
  projectRiskService,
  requirementService,
  traceabilityService,
  aiEngineService,
  adminService
};

export default firebaseService;
