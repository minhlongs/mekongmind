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

// Package health provides parallel health probing for Mekong IDE's MLX endpoints.
// Each endpoint is checked concurrently with a 2-second timeout.
package health

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/mekongmind/engine/internal/router"
)

const (
	// ProbeTimeout is the per-endpoint HTTP timeout for health checks.
	ProbeTimeout = 2 * time.Second

	// HealthPath is the endpoint path used for health probing.
	HealthPath = "/v1/models"
)

// EndpointStatus holds the health result for a single MLX endpoint.
type EndpointStatus struct {
	Endpoint router.Endpoint
	Up       bool
	// Latency is the round-trip time if Up=true, else 0.
	Latency time.Duration
	// Error describes why the probe failed when Up=false.
	Error string
}

// Checker performs parallel health checks against all endpoints in a registry.
type Checker struct {
	registry *router.Registry
	client   *http.Client
}

// NewChecker creates a Checker for the given endpoint registry.
func NewChecker(registry *router.Registry) *Checker {
	return &Checker{
		registry: registry,
		client:   &http.Client{Timeout: ProbeTimeout},
	}
}

// CheckAll probes all three MLX endpoints in parallel.
// Returns a slice of EndpointStatus in the same order as registry.All().
// Never blocks longer than ProbeTimeout + small scheduling overhead.
func (c *Checker) CheckAll(ctx context.Context) []EndpointStatus {
	endpoints := c.registry.All()
	results := make([]EndpointStatus, len(endpoints))

	var wg sync.WaitGroup
	for i, ep := range endpoints {
		wg.Add(1)
		go func(idx int, endpoint router.Endpoint) {
			defer wg.Done()
			results[idx] = c.probeOne(ctx, endpoint)
		}(i, ep)
	}
	wg.Wait()

	return results
}

// probeOne performs a single HTTP GET to endpoint/v1/models.
func (c *Checker) probeOne(ctx context.Context, ep router.Endpoint) EndpointStatus {
	url := fmt.Sprintf("http://127.0.0.1:%d%s", ep.Port, HealthPath)

	reqCtx, cancel := context.WithTimeout(ctx, ProbeTimeout)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, http.MethodGet, url, nil)
	if err != nil {
		return EndpointStatus{Endpoint: ep, Up: false, Error: err.Error()}
	}

	start := time.Now()
	resp, err := c.client.Do(req)
	latency := time.Since(start)

	if err != nil {
		return EndpointStatus{Endpoint: ep, Up: false, Error: err.Error()}
	}
	resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return EndpointStatus{
			Endpoint: ep,
			Up:       false,
			Error:    fmt.Sprintf("HTTP %d", resp.StatusCode),
		}
	}

	return EndpointStatus{Endpoint: ep, Up: true, Latency: latency}
}

// AllUp returns true if every endpoint in statuses reports Up=true.
func AllUp(statuses []EndpointStatus) bool {
	for _, s := range statuses {
		if !s.Up {
			return false
		}
	}
	return true
}
