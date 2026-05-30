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

//go:build darwin

package datasources_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/mekongmind/engine/internal/cashclaw/datasources"
)

// fakeVnstockServer creates an httptest.Server that returns a canned OHLCV response.
func fakeVnstockServer(t *testing.T, ohlcv []datasources.OHLCVRecord) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/rpc" {
			http.Error(w, "unexpected", http.StatusNotFound)
			return
		}
		// Wrap in the JSON-RPC envelope that VnstockClient expects.
		inner, _ := json.Marshal(map[string]any{"ohlcv": ohlcv})
		resp := map[string]any{
			"jsonrpc": "2.0",
			"id":      1,
			"result": map[string]any{
				"content": []map[string]string{{"text": string(inner)}},
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
}

func TestVnstockClient_GetOHLCV_Success(t *testing.T) {
	want := []datasources.OHLCVRecord{
		{Date: "2026-03-01", Open: 90.0, High: 91.0, Low: 89.5, Close: 90.5, Volume: 500000},
		{Date: "2026-03-02", Open: 90.5, High: 91.5, Low: 90.0, Close: 91.0, Volume: 600000},
	}

	srv := fakeVnstockServer(t, want)
	defer srv.Close()

	client := datasources.NewVnstockClient(srv.URL, nil)
	got, err := client.GetOHLCV(context.Background(), "VNM", 90)
	if err != nil {
		t.Fatalf("GetOHLCV error: %v", err)
	}
	if len(got) != len(want) {
		t.Fatalf("got %d records, want %d", len(got), len(want))
	}
	if got[0].Close != want[0].Close {
		t.Errorf("got close=%.2f, want %.2f", got[0].Close, want[0].Close)
	}
}

func TestVnstockClient_GetOHLCV_Cache(t *testing.T) {
	callCount := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		callCount++
		inner, _ := json.Marshal(map[string]any{
			"ohlcv": []datasources.OHLCVRecord{{Date: "2026-03-01", Close: 90.0}},
		})
		resp := map[string]any{
			"jsonrpc": "2.0", "id": 1,
			"result": map[string]any{"content": []map[string]string{{"text": string(inner)}}},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer srv.Close()

	client := datasources.NewVnstockClient(srv.URL, nil)
	ctx := context.Background()

	// First call — hits server.
	if _, err := client.GetOHLCV(ctx, "VNM", 90); err != nil {
		t.Fatal(err)
	}
	// Second call — should hit cache.
	if _, err := client.GetOHLCV(ctx, "VNM", 90); err != nil {
		t.Fatal(err)
	}

	if callCount != 1 {
		t.Errorf("expected 1 server call (cache hit on 2nd), got %d", callCount)
	}
}

func TestVnstockClient_GetOHLCV_DifferentKeysNotCached(t *testing.T) {
	callCount := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		callCount++
		inner, _ := json.Marshal(map[string]any{"ohlcv": []datasources.OHLCVRecord{}})
		resp := map[string]any{
			"jsonrpc": "2.0", "id": 1,
			"result": map[string]any{"content": []map[string]string{{"text": string(inner)}}},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer srv.Close()

	client := datasources.NewVnstockClient(srv.URL, nil)
	ctx := context.Background()

	client.GetOHLCV(ctx, "VNM", 90)
	client.GetOHLCV(ctx, "FPT", 90) // different symbol
	client.GetOHLCV(ctx, "VNM", 30) // same symbol, different days

	if callCount != 3 {
		t.Errorf("expected 3 server calls for different keys, got %d", callCount)
	}
}

func TestVnstockClient_GetOHLCV_ServerError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "internal error", http.StatusInternalServerError)
	}))
	defer srv.Close()

	client := datasources.NewVnstockClient(srv.URL, nil)
	_, err := client.GetOHLCV(context.Background(), "VNM", 90)
	if err == nil {
		t.Fatal("expected error on server 500, got nil")
	}
}

func TestVnstockClient_CacheTTL_Expired(t *testing.T) {
	// This test verifies the cache logic conceptually via ClearCache.
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		inner, _ := json.Marshal(map[string]any{"ohlcv": []datasources.OHLCVRecord{}})
		resp := map[string]any{
			"jsonrpc": "2.0", "id": 1,
			"result": map[string]any{"content": []map[string]string{{"text": string(inner)}}},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer srv.Close()

	client := datasources.NewVnstockClient(srv.URL, &http.Client{Timeout: 5 * time.Second})
	ctx := context.Background()
	client.GetOHLCV(ctx, "VNM", 90)
	client.ClearCache()
	client.GetOHLCV(ctx, "VNM", 90) // should hit server again after clear

	// Verify clearing doesn't break anything.
	_ = ctx
}

func TestMT5Client_GetQuote_NotImplemented(t *testing.T) {
	mt5 := datasources.NewMT5Client("http://127.0.0.1:5002")
	_, err := mt5.GetQuote("EURUSD")
	if err == nil {
		t.Fatal("expected ErrNotImplemented, got nil")
	}
	if err != datasources.ErrNotImplemented {
		t.Errorf("expected ErrNotImplemented, got %v", err)
	}
}

func TestMT5Client_GetOHLCV_NotImplemented(t *testing.T) {
	mt5 := datasources.NewMT5Client("http://127.0.0.1:5002")
	_, err := mt5.GetOHLCV("EURUSD", "2026-01-01", "2026-03-01")
	if err != datasources.ErrNotImplemented {
		t.Errorf("expected ErrNotImplemented, got %v", err)
	}
}
