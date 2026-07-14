// src/services/abhaService.js

/**
 * Service layer for ABHA (Ayushman Bharat Health Account) API integration.
 * Currently uses placeholder endpoints from the Python backend.
 * Once real ABDM APIs are integrated, update these methods to call the gateway directly
 * or update the backend to proxy the real ABDM calls.
 */

export const abhaService = {
  /**
   * Verify an ABHA ID and link it to the patient.
   * @param {string} patientId 
   * @param {string} abhaId 
   * @returns {Promise<{status: string, message: string}>}
   */
  async verifyAbha(patientId, abhaId) {
    const res = await fetch(`/patients/${patientId}/abha/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ abhaId }),
    });
    if (!res.ok) throw new Error("Failed to verify ABHA ID");
    return res.json();
  },

  /**
   * Request consent from the patient to view records.
   * @param {string} patientId 
   * @returns {Promise<{status: string}>}
   */
  async requestConsent(patientId) {
    const res = await fetch(`/patients/${patientId}/abha/request-consent`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to request consent");
    return res.json();
  },

  /**
   * Get current ABHA linkage and consent status.
   * @param {string} patientId 
   * @returns {Promise<{abhaStatus: string, consentStatus: string}>}
   */
  async getStatus(patientId) {
    const res = await fetch(`/patients/${patientId}/abha/status`);
    if (!res.ok) throw new Error("Failed to get status");
    return res.json();
  },

  /**
   * Sync records from the HIE-CM.
   * @param {string} patientId 
   * @returns {Promise<{status: string, recordsImported: number}>}
   */
  async syncRecords(patientId) {
    const res = await fetch(`/patients/${patientId}/abha/sync`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to sync records");
    return res.json();
  },

  /**
   * Unlink ABHA account.
   * @param {string} patientId 
   * @returns {Promise<{status: string}>}
   */
  async unlinkAbha(patientId) {
    const res = await fetch(`/patients/${patientId}/abha/unlink`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to unlink ABHA");
    return res.json();
  },

  /**
   * Get ABHA demographic profile.
   * @param {string} patientId 
   * @returns {Promise<any>}
   */
  async getProfile(patientId) {
    const res = await fetch(`/patients/${patientId}/abha/profile`);
    if (!res.ok) throw new Error("Failed to get ABHA profile");
    return res.json();
  },

  /**
   * Get imported clinical records.
   * @param {string} patientId 
   * @returns {Promise<any>}
   */
  async getImportedRecords(patientId) {
    const res = await fetch(`/patients/${patientId}/abha/imported-records`);
    if (!res.ok) throw new Error("Failed to get imported records");
    return res.json();
  }
};
