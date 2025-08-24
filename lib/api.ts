import axios from "axios";

const baseURL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:4000"
    : "https://api.calari.in";

export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});
