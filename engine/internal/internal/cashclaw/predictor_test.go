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

package cashclaw_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/mekongmind/engine/internal/cashclaw"
	"github.com/mekongmind/engine/internal/cashclaw/datasources"
)

func fakeKronosServer(t *testing.T, resp *cashclaw.PredictResponse) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/predict":
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(resp)
		case "/health":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"ok","model_loaded":true,"device":"cpu"}`))
		default:
			http.NotFound(w, r)
		}
	}))
}

func sampleOHLCV(n int) []datasources.OHLCVRecord {
	records := make([]datasources.OHLCVRecord, n)
	for i := range records {
		records[i] = datasources.OHLCVRecord{
			Date: "2026-03-01", Open: 90.0, High: 91.0, Low: 89.5, Close: 90.5, Volume: 500000,
		}
	}
	return records
}

func TestKronosPredictor_Predict_Success(t *testing.T) {
	want := &cashclaw.PredictResponse{
		Symbol:  "VNM",
		Horizon: 5,
		Forecast: []cashclaw.ForecastRecord{
			{Period: 1, Open: 90.1, High: 90.5, Low: 89.8, Close: 90.2, Volume: 0},
			{Period: 2, Open: 90.2, High: 90.6, Low: 89.9, Close: 90.3, Volume: 0},
		},
	}

	srv := fakeKronosServer(t, want)
	defer srv.Close()

	kr := cashclaw.NewKronosPredictor(srv.URL, nil)
	got, err := kr.Predict(context.Background(), "VNM", sampleOHLCV(30), 5)
	if err != nil {
		t.Fatalf("Predict error: %v", err)
	}
	if got.Symbol != want.Symbol {
		t.Errorf("symbol: got %q, want %q", got.Symbol, want.Symbol)
	}
	if len(got.Forecast) != len(want.Forecast) {
		t.Errorf("forecast len: got %d, want %d", len(got.Forecast), len(want.Forecast))
	}
}

func TestKronosPredictor_Predict_EmptyOHLCV(t *testing.T) {
	kr := cashclaw.NewKronosPredictor("http://127.0.0.1:5001", nil)
	_, err := kr.Predict(context.Background(), "VNM", nil, 5)
	if err == nil {
		t.Fatal("expected error for empty OHLCV, got nil")
	}
}

func TestKronosPredictor_HealthCheck_Success(t *testing.T) {
	srv := fakeKronosServer(t, &cashclaw.PredictResponse{})
	defer srv.Close()

	kr := cashclaw.NewKronosPredictor(srv.URL, nil)
	if err := kr.HealthCheck(context.Background()); err != nil {
		t.Errorf("HealthCheck failed: %v", err)
	}
}

func TestKronosPredictor_HealthCheck_Down(t *testing.T) {
	kr := cashclaw.NewKronosPredictor("http://127.0.0.1:19999", nil)
	if err := kr.HealthCheck(context.Background()); err == nil {
		t.Fatal("expected error when service is down, got nil")
	}
}

func TestKronosPredictor_Predict_ServerError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "model not ready", http.StatusServiceUnavailable)
	}))
	defer srv.Close()

	kr := cashclaw.NewKronosPredictor(srv.URL, nil)
	_, err := kr.Predict(context.Background(), "VNM", sampleOHLCV(30), 5)
	if err == nil {
		t.Fatal("expected error on server 503, got nil")
	}
}
