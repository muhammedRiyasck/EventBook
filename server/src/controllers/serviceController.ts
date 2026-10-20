/**
 * Service Controller (Barrel Re-export)
 * Consolidates all service sub-controllers for seamless route compatibility.
 */

export {
  getServices,
  getServiceById,
  getAvailableSlots,
} from './service/serviceQueries';

export {
  createService,
  updateService,
  deleteService,
} from './service/serviceAdmin';
