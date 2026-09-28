import axiosInstance from "@/utils/axiosInstance";

const referenceService = {
    getMedicines: async () => {
        const res = await axiosInstance.get("/medicines", { params: { limit: 500, isActive: true } });
        return res.data.data || [];
    },
    getCompanies: async () => {
        const res = await axiosInstance.get("/companies", { params: { limit: 500, isActive: true } });
        return res.data.data || [];
    },
    getCategories: async () => {
        const res = await axiosInstance.get("/categories", { params: { limit: 500, isActive: true } });
        return res.data.data || [];
    },
    getSizes: async () => {
        const res = await axiosInstance.get("/sizes", { params: { limit: 500, isActive: true } });
        return res.data.data || [];
    },
    getPotencies: async () => {
        const res = await axiosInstance.get("/potencies", { params: { limit: 500, isActive: true } });
        return res.data.data || [];
    },
    getUseTypes: async () => {
        const res = await axiosInstance.get("/use-types", { params: { limit: 500, isActive: true } });
        return res.data.data || [];
    },
};

export default referenceService;