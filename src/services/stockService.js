import axiosInstance from "@/utils/axiosInstance";

const stockService = {
    addStock: async (data) => {
        const res = await axiosInstance.post("/stock/add", data);
        return res.data;
    },
    removeStock: async (data) => {
        const res = await axiosInstance.post("/stock/remove", data);
        return res.data;
    },
    quickSell: async (data) => {
        const res = await axiosInstance.post("/stock/sell", data);
        return res.data;
    },
    getBatches: async (productId) => {
        const res = await axiosInstance.get(`/stock/batches/${productId}`);
        return res.data;
    },
    getTransactions: async (params = {}) => {
        const res = await axiosInstance.get("/stock/transactions", { params });
        return res.data;
    },
};

export default stockService;