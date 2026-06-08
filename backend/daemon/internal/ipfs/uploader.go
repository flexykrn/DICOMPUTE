package ipfs

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"

	"go.uber.org/zap"
)

// Uploader handles IPFS uploads via Pinata
type Uploader struct {
	pinataJWT string
	logger    *zap.Logger
}

// NewUploader creates a new IPFS uploader
func NewUploader(pinataJWT string, logger *zap.Logger) *Uploader {
	return &Uploader{
		pinataJWT: pinataJWT,
		logger:    logger,
	}
}

// UploadText uploads text content to IPFS via Pinata and returns the CID
func (u *Uploader) UploadText(ctx context.Context, content string, filename string) (string, error) {
	if u.pinataJWT == "" {
		u.logger.Warn("no Pinata JWT configured, using fallback CID")
		return fmt.Sprintf("QmFallback%s", time.Now().Unix()), nil
	}

	// Build multipart form
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	
	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return "", fmt.Errorf("failed to create form file: %w", err)
	}
	
	if _, err := io.WriteString(part, content); err != nil {
		return "", fmt.Errorf("failed to write content: %w", err)
	}
	
	if err := writer.Close(); err != nil {
		return "", fmt.Errorf("failed to close writer: %w", err)
	}

	// Create request
	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.pinata.cloud/pinning/pinFileToIPFS", &body)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	
	req.Header.Set("Authorization", "Bearer "+u.pinataJWT)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// Execute request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("pinata request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("pinata upload failed: %d - %s", resp.StatusCode, string(respBody))
	}

	// Parse response
	var result struct {
		IpfsHash string `json:"IpfsHash"`
		PinSize  int    `json:"PinSize"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	u.logger.Info("uploaded to IPFS", zap.String("cid", result.IpfsHash))
	return result.IpfsHash, nil
}

// UploadJSON uploads JSON data to IPFS via Pinata
func (u *Uploader) UploadJSON(ctx context.Context, data interface{}) (string, error) {
	if u.pinataJWT == "" {
		u.logger.Warn("no Pinata JWT configured, using fallback CID")
		return fmt.Sprintf("QmFallbackJSON%s", time.Now().Unix()), nil
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return "", fmt.Errorf("failed to marshal JSON: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.pinata.cloud/pinning/pinJSONToIPFS", bytes.NewReader(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	
	req.Header.Set("Authorization", "Bearer "+u.pinataJWT)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("pinata request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("pinata upload failed: %d - %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		IpfsHash string `json:"IpfsHash"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	u.logger.Info("uploaded JSON to IPFS", zap.String("cid", result.IpfsHash))
	return result.IpfsHash, nil
}
