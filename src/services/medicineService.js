import axiosInstance from "@/utils/axiosInstance";

const medicineService = {
    getAll: async (params = {}) => {
        const res = await axiosInstance.get("/medicines", { params });
        return res.data;
    },
    getById: async (id) => {
        const res = await axiosInstance.get(`/medicines/${id}`);
        return res.data;
    },
    create: async (data) => {
        const res = await axiosInstance.post("/medicines", data);
        return res.data;
    },
    update: async (id, data) => {
        const res = await axiosInstance.put(`/medicines/${id}`, data);
        return res.data;
    },
    delete: async (id) => {
        const res = await axiosInstance.delete(`/medicines/${id}`);
        return res.data;
    },
};

export default medicineService;