import axiosInstance from "@/utils/axiosInstance";

const useTypeService = {
    getAll: async (params = {}) => {
        const res = await axiosInstance.get("/use-types", { params });
        return res.data;
    },
    getById: async (id) => {
        const res = await axiosInstance.get(`/use-types/${id}`);
        return res.data;
    },
    create: async (data) => {
        const res = await axiosInstance.post("/use-types", data);
        return res.data;
    },
    update: async (id, data) => {
        const res = await axiosInstance.put(`/use-types/${id}`, data);
        return res.data;
    },
    delete: async (id) => {
        const res = await axiosInstance.delete(`/use-types/${id}`);
        return res.data;
    },
};

export default useTypeService;