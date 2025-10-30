// utils/MISApiCall.js
import axios from "axios";

const API_BASE = "http://sampoorna.cao.local/afcao/ipas/ivrs"; 

export default async function API_CALL(type, section, id, offset = 0) {
  try {
    if (!type || !section || typeof id === "undefined" || id === null) {
      throw new Error("Missing required parameters: type, section or id");
    }
    const encodedSection = encodeURIComponent(section);
    const url = `${API_BASE}/${type}/${encodedSection}/${id}`;
    const res = await axios.get(url, { params: { offset } });
    return res.data;
  } catch (error) {
    const msg = error?.response?.data?.message || error.message || "Unknown error";
    const status = error?.response?.status;
    const details = { message: msg, status };
    const err = new Error(`API_CALL failed for ${type}/${section}/${id}: ${msg}`);
    err.details = details;
    throw err;
  }
}
