import axiosInstance from "@/utils/axiosInstance";

const productService = {
    getAll: async (params = {}) => {
        const res = await axiosInstance.get("/products", { params });
        return res.data;
    },
    getById: async (id) => {
        const res = await axiosInstance.get(`/products/${id}`);
        return res.data;
    },
    create: async (data) => {
        const res = await axiosInstance.post("/products", data);
        return res.data;
    },
    update: async (id, data) => {
        const res = await axiosInstance.put(`/products/${id}`, data);
        return res.data;
    },
    delete: async (id) => {
        const res = await axiosInstance.delete(`/products/${id}`);
        return res.data;
    },
};

export default productService;