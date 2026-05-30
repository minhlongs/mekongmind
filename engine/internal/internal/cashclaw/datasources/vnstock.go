// Copyright 2026 Mekong IDE Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Package datasources provides data adapters for CashClaw financial data sources.
// vnstock.go: HTTP/JSON-RPC adapter to the existing vnstock-mcp Python service.
package datasources

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"
	"time"
)

// DefaultVnstockURL is the base URL used when no explicit URL is provided.
// Override via VNSTOCK_MCP_URL environment variable.
// NOTE: vnstock-mcp currently runs stdio-only; the HTTP transport at this
// address requires a separate HTTP-to-MCP bridge (e.g. mcp-proxy). See
// tools/vnstock-mcp/README for setup instructions.
const DefaultVnstockURL = "http://127.0.0.1:5010"

// VnstockBaseURL returns the configured vnstock-mcp base URL.
// Precedence: env VNSTOCK_MCP_URL > fallback DefaultVnstockURL.
func VnstockBaseURL() string {
	if u := os.Getenv("VNSTOCK_MCP_URL"); u != "" {
		return u
	}
	return DefaultVnstockURL
}

// ohlcvCacheTTL is the in-memory cache lifetime for OHLCV data.
const ohlcvCacheTTL = 5 * time.Minute

// OHLCVRecord represents one day of OHLCV price data from vnstock.
type OHLCVRecord struct {
	Date   string  `json:"time"`
	Open   float64 `json:"open"`
	High   float64 `json:"high"`
	Low    float64 `json:"low"`
	Close  float64 `json:"close"`
	Volume float64 `json:"volume"`
}

// cacheEntry wraps OHLCV data with a TTL expiry.
type cacheEntry struct {
	records   []OHLCVRecord
	expiresAt time.Time
}

// VnstockClient calls the vnstock-mcp service over HTTP/JSON-RPC.
// The vnstock-mcp server must be running (stdio mode proxied via HTTP or
// started with --transport http if that mode is added in the future).
// For now, we call the service via the MCP JSON-RPC protocol over HTTP.
type VnstockClient struct {
	http    *http.Client
	baseURL string // e.g. "http://127.0.0.1:5010"

	mu    sync.Mutex
	cache map[string]cacheEntry // key: "SYMBOL-days"
}

// NewVnstockClient creates a client pointing at the given vnstock-mcp base URL.
// Pass httpClient=nil to use the default with a 10s timeout.
func NewVnstockClient(baseURL string, httpClient *http.Client) *VnstockClient {
	if httpClient == nil {
		httpClient = &http.Client{Timeout: 10 * time.Second}
	}
	return &VnstockClient{
		http:    httpClient,
		baseURL: baseURL,
		cache:   make(map[string]cacheEntry),
	}
}

// GetOHLCV fetches OHLCV history for `symbol` covering `days` calendar days
// ending today. Results are cached for ohlcvCacheTTL.
func (v *VnstockClient) GetOHLCV(ctx context.Context, symbol string, days int) ([]OHLCVRecord, error) {
	cacheKey := fmt.Sprintf("%s-%d", symbol, days)

	v.mu.Lock()
	if entry, ok := v.cache[cacheKey]; ok && time.Now().Before(entry.expiresAt) {
		records := entry.records
		v.mu.Unlock()
		return records, nil
	}
	v.mu.Unlock()

	end := time.Now().Format("2006-01-02")
	start := time.Now().AddDate(0, 0, -days).Format("2006-01-02")

	// Retry once on transient network failure (e.g. vnstock-mcp restart).
	records, err := v.fetchOHLCV(ctx, symbol, start, end)
	if err != nil {
		records, err = v.fetchOHLCV(ctx, symbol, start, end)
		if err != nil {
			// Wrap with actionable context so callers know which service is down.
			return nil, fmt.Errorf("vnstock: service at %s unreachable (retry exhausted): %w", v.baseURL, err)
		}
	}

	v.mu.Lock()
	v.cache[cacheKey] = cacheEntry{records: records, expiresAt: time.Now().Add(ohlcvCacheTTL)}
	v.mu.Unlock()

	return records, nil
}

// fetchOHLCV calls the vnstock-mcp get_stock_price tool via JSON-RPC over HTTP.
func (v *VnstockClient) fetchOHLCV(ctx context.Context, symbol, start, end string) ([]OHLCVRecord, error) {
	// JSON-RPC 2.0 payload targeting the MCP call_tool endpoint.
	payload := map[string]any{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  "tools/call",
		"params": map[string]any{
			"name": "get_stock_price",
			"arguments": map[string]string{
				"ticker":     symbol,
				"start_date": start,
				"end_date":   end,
			},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("vnstock: marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, v.baseURL+"/rpc", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("vnstock: build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := v.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("vnstock: POST /rpc: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		raw, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return nil, fmt.Errorf("vnstock: HTTP %d: %s", resp.StatusCode, raw)
	}

	// Parse outer JSON-RPC envelope.
	var rpcResp struct {
		Result struct {
			Content []struct {
				Text string `json:"text"`
			} `json:"content"`
		} `json:"result"`
		Error *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&rpcResp); err != nil {
		return nil, fmt.Errorf("vnstock: decode RPC response: %w", err)
	}
	if rpcResp.Error != nil {
		return nil, fmt.Errorf("vnstock: RPC error: %s", rpcResp.Error.Message)
	}
	if len(rpcResp.Result.Content) == 0 {
		return nil, fmt.Errorf("vnstock: empty result content")
	}

	// Parse inner JSON payload from the TextContent.
	var data struct {
		OHLCV []OHLCVRecord `json:"ohlcv"`
	}
	if err := json.Unmarshal([]byte(rpcResp.Result.Content[0].Text), &data); err != nil {
		return nil, fmt.Errorf("vnstock: parse ohlcv: %w", err)
	}

	return data.OHLCV, nil
}

// ClearCache removes all cached entries (useful in tests).
func (v *VnstockClient) ClearCache() {
	v.mu.Lock()
	v.cache = make(map[string]cacheEntry)
	v.mu.Unlock()
}
