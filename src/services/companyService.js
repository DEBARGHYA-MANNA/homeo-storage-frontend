import axiosInstance from "@/utils/axiosInstance";

const companyService = {
    // Get all companies
    getAll: async (params = {}) => {
        const res = await axiosInstance.get("/companies", { params });
        return res.data;
    },

    // Get single company by ID
    getById: async (id) => {
        const res = await axiosInstance.get(`/companies/${id}`);
        return res.data;
    },

    // Create a new company
    create: async (data) => {
        const res = await axiosInstance.post("/companies", data);
        return res.data;
    },

    // Update a company
    update: async (id, data) => {
        const res = await axiosInstance.put(`/companies/${id}`, data);
        return res.data;
    },

    // Delete a company
    delete: async (id) => {
        const res = await axiosInstance.delete(`/companies/${id}`);
        return res.data;
    },
};

export default companyService;