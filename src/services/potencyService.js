import axiosInstance from "@/utils/axiosInstance";

const potencyService = {
    getAll: async (params = {}) => {
        const res = await axiosInstance.get("/potencies", { params });
        return res.data;
    },
    getById: async (id) => {
        const res = await axiosInstance.get(`/potencies/${id}`);
        return res.data;
    },
    create: async (data) => {
        const res = await axiosInstance.post("/potencies", data);
        return res.data;
    },
    update: async (id, data) => {
        const res = await axiosInstance.put(`/potencies/${id}`, data);
        return res.data;
    },
    delete: async (id) => {
        const res = await axiosInstance.delete(`/potencies/${id}`);
        return res.data;
    },
};

export default potencyService;