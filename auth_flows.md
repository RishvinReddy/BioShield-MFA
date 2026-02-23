# BioShield MFA - System Process Flows

This document details the exact control flow for the core authentication and security mechanisms required for the project documentation/defense.

---

## 1. Risk-Adaptive Login Flow

**Endpoint:** `POST /api/auth/login`

1.  **Input Reception**:
    *   Server receives `username`, `password`.
    *   Server receives client-side metadata: `deviceFingerprint` (hash), `behavioralMetrics` (keystroke dynamics), and `User-Agent`.
    *   Server extracts Network IP.

2.  **Credential Verification**:
    *   Database query for user by `username`.
    *   If user found, verify `password` using `bcrypt.compare`.
    *   **Strict Role Check**: If `role` was requested, verify `user.role` matches.

3.  **Risk Engine Assessment (`evaluateRisk`)**:
    *   **Device Analysis**:
        *   Check `TrustedDevice` table for `(userId, deviceFingerprint)`.
        *   If found: **-30 Risk Score** (Trusted).
        *   If not found: **+20 Risk Score** (New Device) & Flag `isNewDevice = true`.
    *   **Behavioral Analysis**:
        *   Analyze typing cadence/flight time.
        *   If `isBot` detected: **+50 Risk Score**.
    *   **Score Normalization**: Clamp score between 0 and 100.

4.  **Decision Logic**:
    *   **Risk > 80 (High)**: Return `BLOCK` decision.
        *   Action: Throw `403 Access Denied`.
        *   Audit: Log `LOGIN_BLOCKED` event.
    *   **Risk > 30 (Medium)**: Return `MFA_REQUIRED` (Logic ready, currently treating as Allow with flag).
    *   **Risk <= 30 (Low)**: Return `ALLOW`.

5.  **Post-Decision Actions**:
    *   **Trust On First Use (TOFU)**: If `isNewDevice` is true and decision is not BLOCK, automatically register the Device Fingerprint as a new `TrustedDevice`.
    *   **Token Issuance**: Generate JWT (JSON Web Token) with `userId` and `role`.
    *   **Audit Logging**: Create `LoginAttempt` record and crypto-signed `AuditLog` entry for `LOGIN_SUCCESS`.

---

## 2. Privacy-Preserving Biometric Enrollment

**Endpoint:** `POST /api/biometric/enroll`

1.  **Upload**: Authenticated user uploads raw biometric sample (e.g., face image).
2.  **Feature Extraction**:
    *   Server processes image to extract vector features (128-float array).
3.  **Envelope Encryption (KMS)**:
    *   Server requests a new Data Encryption Key (DEK) from Key Management Service (simulated/AWS).
    *   KMS returns `Plaintext DEK` (memory only) and `Encrypted DEK` (for storage).
4.  **Template Protection (SHE-256)**:
    *   **Key Derivation**: Derive `TransformKey` from `Plaintext DEK` using HKDF-SHA512.
    *   **Homomorphic Encryption**: Encrypt the feature vector using `TransformKey` -> Generates `SHE-256 Template` (Secure Homomorphic Encryption). This allows matching *without* decrypting.
5.  **Storage Layer Encryption**:
    *   Encrypt `SHE-256 Template` + `Raw Image` using `AES-256-GCM` with the `Plaintext DEK`.
    *   Generates `Storage Blob` (includes IV and Auth Tag).
6.  **Persistence**:
    *   Save `Encrypted DEK` + `Storage Blob` to PostgreSQL `BiometricAsset` table.
    *   **Zero-Knowledge**: The Server *never* stores the Raw Image or Plaintext DEK persistently.

---

## 3. Biometric Verification (1:N Match)

**Endpoint:** `POST /api/biometric/verify`

1.  **Probe Submission**: User uploads a new sample for verification.
2.  **Probe Extraction**: Server extracts feature vector from the new sample (Probe).
3.  **Candidate Retrieval**: Server fetches all active `BiometricAsset` records for the user.
4.  **Matching Loop**:
    *   For each asset:
        1.  **Unseal Key**: Decrypt `Encrypted DEK` using KMS to get `Plaintext DEK`.
        2.  **Derive Transform**: Re-derive `TransformKey` using HKDF.
        3.  **Unseal Storage**: Decrypt the `Storage Blob` (AES-256) to retrieve the **Encrypted** `SHE-256 Template`.
        4.  **Secure Match**: Perform mathematical operation: `Verify(EncryptedTemplate, PlaintextProbe, TransformKey)`.
            *   *Note: The Template is NEVER fully decrypted to raw features during this process.*
5.  **Result**:
    *   If Match Score > Threshold: Return `Verified: True`.
    *   Else: Return `Verified: False`.
6.  **Audit**: Log the verification attempt and score.

---

## 4. QR Code Cross-Device Login

**Endpoint:** `/api/auth/qr/*`

1.  **Initialization (Web Client)**:
    *   Web Client calls `/init`. Server generates `SessionID` + `Nonce`.
    *   Server stores Session (`status: PENDING`) in DB.
    *   Web Client displays QR Code containing `SessionID`.
2.  **Polling (Web Client)**:
    *   Web Client polls `/poll/:sessionId` every 2 seconds.
3.  **Scanning & Approval (Mobile Device)**:
    *   User (already logged in on Mobile) scans QR code.
    *   Mobile App calls `/approve` with `SessionID` and sends its valid `AuthToken`.
    *   Server validates `AuthToken`, checks Session validity.
    *   Server updates Session: `status = APPROVED`, `userId = mobileUser.id`.
4.  **Completion (Web Client)**:
    *   Next poll from Web Client sees `APPROVED`.
    *   Server generates a new JWT for the Web Client.
    *   Server deletes the temporary Session (One-time use).

---

## 5. System Administration & Audit

**Endpoints:** `/api/admin/*`, `/api/forensics/*`

1.  **Admin Actions**:
    *   **Create User**: Admin can create users. Action is logged to `admin_audit_log` with encrypted details (AES-GCM) to prevent tampering even by DB admins.
2.  **Forensic Deepfake Analysis**:
    *   Upload media.
    *   Server runs heuristics (metadata, noise analysis) to detect synthetic media.
    *   Returns `Confidence Score`. High confidence triggers an immediate Security Alert log.
