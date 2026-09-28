import axiosInstance from "@/utils/axiosInstance";

const sizeService = {
    // Get all sizes (with optional search, unit, isActive params)
    getAll: async (params = {}) => {
        const res = await axiosInstance.get("/sizes", { params });
        return res.data;
    },

    // Get single size by ID
    getById: async (id) => {
        const res = await axiosInstance.get(`/sizes/${id}`);
        return res.data;
    },

    // Create a new size
    create: async (data) => {
        const res = await axiosInstance.post("/sizes", data);
        return res.data;
    },

    // Update a size
    update: async (id, data) => {
        const res = await axiosInstance.put(`/sizes/${id}`, data);
        return res.data;
    },

    // Delete a size
    delete: async (id) => {
        const res = await axiosInstance.delete(`/sizes/${id}`);
        return res.data;
    },
};

export default sizeService;