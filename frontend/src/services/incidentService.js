import api from "./api";

/**
 * Incident Management Axios API Integrations
 */
const incidentService = {
  
  // Get all incidents
  getIncidents: async () => {
    const response = await api.get("/incidents");
    return response.data;
  },

  // Get incident by ID
  getIncidentById: async (id) => {
    const response = await api.get(`/incidents/${id}`);
    return response.data;
  },

  // Create new incident
  createIncident: async (incidentData) => {
    const response = await api.post("/incidents", incidentData);
    return response.data;
  },

  // Update existing incident details/status
  updateIncident: async (id, incidentData) => {
    const response = await api.put(`/incidents/${id}`, incidentData);
    return response.data;
  },

  // Delete incident
  deleteIncident: async (id) => {
    const response = await api.delete(`/incidents/${id}`);
    return response.data;
  },

  // Escalate incident
  escalateIncident: async (id) => {
    const response = await api.put(`/incidents/${id}/escalate`);
    return response.data;
  },

  // Resolve incident
  resolveIncident: async (id) => {
    const response = await api.put(`/incidents/${id}/resolve`);
    return response.data;
  },
};

export default incidentService;
