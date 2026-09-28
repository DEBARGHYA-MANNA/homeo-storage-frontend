import axiosInstance from "@/utils/axiosInstance";

const categoryService = {
    // Get all categories (with optional search/filter params)
    getAll: async (params = {}) => {
        const res = await axiosInstance.get("/categories", { params });
        return res.data;
    },

    // Get single category by ID
    getById: async (id) => {
        const res = await axiosInstance.get(`/categories/${id}`);
        return res.data;
    },

    // Create a new category
    create: async (data) => {
        const res = await axiosInstance.post("/categories", data);
        return res.data;
    },

    // Update a category
    update: async (id, data) => {
        const res = await axiosInstance.put(`/categories/${id}`, data);
        return res.data;
    },

    // Delete a category
    delete: async (id) => {
        const res = await axiosInstance.delete(`/categories/${id}`);
        return res.data;
    },
};

export default categoryService;