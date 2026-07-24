import api from "./api";

/**
 * Asset Inventory Axios API Integrations
 */
const assetService = {

  // Get assets (paginated, sorted, and filtered)
  getAssets: async (params) => {
    const response = await api.get("/assets", { params });
    return response.data;
  },

  // Get asset by ID
  getAssetById: async (id) => {
    const response = await api.get(`/assets/${id}`);
    return response.data;
  },

  // Create new asset
  createAsset: async (assetData) => {
    const response = await api.post("/assets", assetData);
    return response.data;
  },

  // Update existing asset
  updateAsset: async (id, assetData) => {
    const response = await api.put(`/assets/${id}`, assetData);
    return response.data;
  },

  // Delete asset
  deleteAsset: async (id) => {
    const response = await api.delete(`/assets/${id}`);
    return response.data;
  },

  // Search assets (non-paginated)
  searchAssets: async (params) => {
    const response = await api.get("/assets/search", { params });
    return response.data;
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get("/assets/dashboard");
    return response.data;
  },

  // Import assets from CSV
  importAssets: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/assets/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Export assets to CSV
  exportAssets: async () => {
    const response = await api.get("/assets/export", {
      responseType: "blob",
    });
    return response.data;
  },
};

export default assetService;
