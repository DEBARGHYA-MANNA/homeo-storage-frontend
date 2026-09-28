"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import axiosInstance from "@/utils/axiosInstance";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Get current logged in user
  const getProfile = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await axiosInstance.get("/auth/profile");
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (error) {
      console.log("Profile Error:", error.response?.data?.message);
      Cookies.remove("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProfile();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await axiosInstance.post("/auth/login", { email, password });
      if (res.data.success) {
        const token = res.data.data.token;
        Cookies.set("token", token, { expires: 7 }); // token valid for 7 days
        setUser(res.data.data);
        toast.success(res.data.message || "Login successful");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    Cookies.remove("token");
    setUser(null);
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, getProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
