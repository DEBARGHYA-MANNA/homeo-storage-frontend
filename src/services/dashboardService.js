import axiosInstance from "@/utils/axiosInstance";

const dashboardService = {
    getStats: async () => {
        const res = await axiosInstance.get("/dashboard/stats");
        return res.data;
    },
};

export default dashboardService;