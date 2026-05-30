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

// Package cashclaw — predictor.go: HTTP client for the Kronos FastAPI service.
// Sends OHLCV CSV and horizon to POST /predict, returns forecast records.
package cashclaw

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/mekongmind/engine/internal/cashclaw/datasources"
)

// PredictRequest is the payload sent to Kronos POST /predict.
type PredictRequest struct {
	Symbol   string `json:"symbol"`
	OHLCVCsv string `json:"ohlcv_csv"` // CSV rows: date,open,high,low,close,volume
	Horizon  int    `json:"horizon"`   // number of future periods to forecast
}

// ForecastRecord holds one predicted future OHLCV bar from Kronos.
type ForecastRecord struct {
	Period int     `json:"period"` // 1-based offset from last historical bar
	Open   float64 `json:"open"`
	High   float64 `json:"high"`
	Low    float64 `json:"low"`
	Close  float64 `json:"close"`
	Volume float64 `json:"volume"`
}

// PredictResponse is the response from Kronos POST /predict.
type PredictResponse struct {
	Symbol   string           `json:"symbol"`
	Horizon  int              `json:"horizon"`
	Forecast []ForecastRecord `json:"forecast"`
}

// KronosPredictor calls the Kronos FastAPI service for OHLCV forecasting.
type KronosPredictor struct {
	http    *http.Client
	baseURL string // e.g. "http://127.0.0.1:5001"
}

// NewKronosPredictor creates a predictor targeting the given Kronos service URL.
// Pass nil httpClient to use default with 10s timeout.
func NewKronosPredictor(baseURL string, httpClient *http.Client) *KronosPredictor {
	if httpClient == nil {
		httpClient = &http.Client{Timeout: 10 * time.Second}
	}
	return &KronosPredictor{
		http:    httpClient,
		baseURL: baseURL,
	}
}

// Predict sends ohlcv records to Kronos and returns a forecast of length horizon.
func (k *KronosPredictor) Predict(ctx context.Context, symbol string, ohlcv []datasources.OHLCVRecord, horizon int) (*PredictResponse, error) {
	if len(ohlcv) == 0 {
		return nil, fmt.Errorf("predictor: no OHLCV data provided for %s", symbol)
	}

	csv := buildOHLCVCsv(ohlcv)
	payload := PredictRequest{
		Symbol:   symbol,
		OHLCVCsv: csv,
		Horizon:  horizon,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("predictor: marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, k.baseURL+"/predict", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("predictor: build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := k.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("predictor: POST /predict: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		raw, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return nil, fmt.Errorf("predictor: Kronos HTTP %d: %s", resp.StatusCode, raw)
	}

	var result PredictResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("predictor: decode response: %w", err)
	}

	return &result, nil
}

// HealthCheck returns nil if the Kronos service responds to GET /health with 2xx.
func (k *KronosPredictor) HealthCheck(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, k.baseURL+"/health", nil)
	if err != nil {
		return fmt.Errorf("predictor: build health request: %w", err)
	}

	resp, err := k.http.Do(req)
	if err != nil {
		return fmt.Errorf("predictor: GET /health: %w", err)
	}
	resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("predictor: Kronos health check HTTP %d", resp.StatusCode)
	}
	return nil
}

// buildOHLCVCsv converts OHLCV records to CSV string expected by Kronos.
// Format: date,open,high,low,close,volume (header row included).
func buildOHLCVCsv(records []datasources.OHLCVRecord) string {
	var sb strings.Builder
	sb.WriteString("date,open,high,low,close,volume\n")
	for _, r := range records {
		sb.WriteString(fmt.Sprintf("%s,%.4f,%.4f,%.4f,%.4f,%.0f\n",
			r.Date, r.Open, r.High, r.Low, r.Close, r.Volume))
	}
	return sb.String()
}
