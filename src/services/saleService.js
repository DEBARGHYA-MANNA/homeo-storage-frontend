import axiosInstance from "@/utils/axiosInstance";

const saleService = {
    create: async (data) => {
        const res = await axiosInstance.post("/sales", data);
        return res.data;
    },
    getAll: async (params = {}) => {
        const res = await axiosInstance.get("/sales", { params });
        return res.data;
    },
    getById: async (id) => {
        const res = await axiosInstance.get(`/sales/${id}`);
        return res.data;
    },
    getTodaySummary: async () => {
        const res = await axiosInstance.get("/sales/summary/today");
        return res.data;
    },
    cancel: async (id) => {
        const res = await axiosInstance.put(`/sales/${id}/cancel`);
        return res.data;
    },
};

export default saleService;