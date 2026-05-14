// crypto.rs — AES-256-GCM encryption commands for Phase 12 (Versleutelde Opslag)
//
// GetItemResponse field name: .data (type Option<String>)
// Verified against tauri-plugin-secure-storage 1.5.0 source (models.rs line 14-16)
// NOT .value as assumed in RESEARCH.md A1 — deviation auto-fixed (Rule 1)
//
// API note: get_item returns Ok(GetItemResponse { data: None }) when key not found,
// not Err. Key absence is detected via data.is_none().
// set_item / get_item take (app: AppHandle<R>, OptionsRequest { prefixed_key, data, .. })

use tauri::AppHandle;
use tauri_plugin_secure_storage::{SecureStorageExt, OptionsRequest};
use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce,
};
use base64::{engine::general_purpose::STANDARD, Engine};

const KEY_IDENTIFIER: &str = "nl.cios.mentordashboard.key";

/// Retrieve the AES-256 key from OS keychain, or generate + store one on first run.
/// Returns the raw 32 key bytes. The key never leaves the Rust layer.
fn get_or_init_key(app: &AppHandle) -> Result<Vec<u8>, String> {
    let storage = app.secure_storage();

    let payload = OptionsRequest {
        prefixed_key: Some(KEY_IDENTIFIER.to_string()),
        data: None,
        sync: None,
        keychain_access: None,
    };

    let response = storage
        .get_item(app.clone(), payload)
        .map_err(|e| format!("Keychain read error: {e}"))?;

    if let Some(key_b64) = response.data {
        // Key exists — decode from Base64
        STANDARD
            .decode(&key_b64)
            .map_err(|e| format!("Key decode error: {e}"))
    } else {
        // Key not found — generate new AES-256 key (32 bytes) and store in keychain
        let key = Aes256Gcm::generate_key(&mut OsRng);
        let key_b64 = STANDARD.encode(&key);

        let set_payload = OptionsRequest {
            prefixed_key: Some(KEY_IDENTIFIER.to_string()),
            data: Some(key_b64),
            sync: None,
            keychain_access: None,
        };

        storage
            .set_item(app.clone(), set_payload)
            .map_err(|e| format!("Keychain write failed: {e}"))?;

        Ok(key.to_vec())
    }
}

/// Retrieve the AES-256 key from OS keychain only (no generation).
/// Returns Err with Dutch error message if key is absent or unreadable.
fn get_key(app: &AppHandle) -> Result<Vec<u8>, String> {
    let storage = app.secure_storage();

    let payload = OptionsRequest {
        prefixed_key: Some(KEY_IDENTIFIER.to_string()),
        data: None,
        sync: None,
        keychain_access: None,
    };

    let response = storage
        .get_item(app.clone(), payload)
        .map_err(|_| "Sleutel niet beschikbaar — neem contact op met beheerder".to_string())?;

    match response.data {
        Some(key_b64) => STANDARD
            .decode(&key_b64)
            .map_err(|e| format!("Key decode error: {e}")),
        None => Err("Sleutel niet beschikbaar — neem contact op met beheerder".to_string()),
    }
}

/// Encrypt plaintext JSON string using AES-256-GCM.
/// Returns Base64-encoded string of (12-byte nonce || ciphertext || 16-byte auth tag).
/// Key is retrieved from / initialized in the OS keychain (D-12-03: key never leaves Rust).
/// A fresh nonce is generated on every call (T-12-02: no nonce reuse).
#[tauri::command]
pub async fn encrypt_klassen(app: AppHandle, plaintext: String) -> Result<String, String> {
    let key_bytes = get_or_init_key(&app)?;
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    // Fresh nonce on EVERY call — never cache or reuse (T-12-02 mitigation)
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

    let ciphertext = cipher
        .encrypt(&nonce, plaintext.as_bytes())
        .map_err(|e| format!("Encrypt failed: {e}"))?;

    // Wire format: Base64(12-byte-nonce || ciphertext || 16-byte-tag)
    let mut combined = nonce.to_vec();
    combined.extend_from_slice(&ciphertext);
    Ok(STANDARD.encode(&combined))
}

/// Decrypt Base64-encoded ciphertext (nonce || ciphertext || tag) using AES-256-GCM.
/// Returns the original plaintext JSON string.
/// Returns Err with Dutch message if key is unavailable (D-12-16).
#[tauri::command]
pub async fn decrypt_klassen(app: AppHandle, ciphertext: String) -> Result<String, String> {
    let key_bytes = get_key(&app)?;
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    let decoded = STANDARD
        .decode(&ciphertext)
        .map_err(|e| format!("Base64 decode: {e}"))?;

    if decoded.len() < 12 {
        return Err("Ciphertext too short".into());
    }

    let (nonce_bytes, ct) = decoded.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext_bytes = cipher
        .decrypt(nonce, ct)
        .map_err(|_| "Decrypt failed — data corrupt or wrong key".to_string())?;

    String::from_utf8(plaintext_bytes).map_err(|e| format!("UTF-8 decode: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Round-trip test: encrypt then decrypt must yield original plaintext.
    /// Uses a fixed [0u8; 32] test key — no OS keychain required for unit test.
    #[test]
    fn encrypt_decrypt_roundtrip() {
        let key_bytes: [u8; 32] = [0u8; 32]; // fixed test key
        let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
        let cipher = Aes256Gcm::new(key);
        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

        let plaintext = b"test payload mentordashboard klassendata";

        // Encrypt
        let ciphertext = cipher.encrypt(&nonce, plaintext.as_ref()).unwrap();

        // Verify we can decrypt back to original
        let decrypted = cipher.decrypt(&nonce, ciphertext.as_ref()).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    /// Verify nonce is prepended: decoded blob length = 12 (nonce) + plaintext_len + 16 (tag)
    #[test]
    fn wire_format_nonce_prepended() {
        let key_bytes: [u8; 32] = [1u8; 32];
        let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
        let cipher = Aes256Gcm::new(key);
        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

        let plaintext = b"hello";
        let ciphertext = cipher.encrypt(&nonce, plaintext.as_ref()).unwrap();

        let mut combined = nonce.to_vec();
        combined.extend_from_slice(&ciphertext);
        let encoded = STANDARD.encode(&combined);

        let decoded = STANDARD.decode(&encoded).unwrap();
        // 12 (nonce) + 5 (plaintext) + 16 (tag) = 33 bytes
        assert_eq!(decoded.len(), 33);
        assert!(decoded.len() >= 12);
    }
}
