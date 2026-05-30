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

package health_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"

	"github.com/mekongmind/engine/internal/health"
	"github.com/mekongmind/engine/internal/router"
)

// startFakeEndpoint starts a test HTTP server and returns its port.
func startFakeEndpoint(t *testing.T, statusCode int) int {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(statusCode)
	}))
	t.Cleanup(srv.Close)

	parts := strings.Split(srv.URL, ":")
	port, _ := strconv.Atoi(parts[len(parts)-1])
	return port
}

func TestCheckAll_AllUp(t *testing.T) {
	p1 := startFakeEndpoint(t, http.StatusOK)
	p2 := startFakeEndpoint(t, http.StatusOK)
	p3 := startFakeEndpoint(t, http.StatusOK)

	reg := router.NewRegistry(p1, p2, p3)
	checker := health.NewChecker(reg)

	statuses := checker.CheckAll(context.Background())
	if len(statuses) != 3 {
		t.Fatalf("expected 3 statuses, got %d", len(statuses))
	}
	for _, s := range statuses {
		if !s.Up {
			t.Errorf("expected endpoint %s (port %d) to be Up", s.Endpoint.Name, s.Endpoint.Port)
		}
	}
	if !health.AllUp(statuses) {
		t.Error("expected AllUp=true when all endpoints 200")
	}
}

func TestCheckAll_OneDown(t *testing.T) {
	p1 := startFakeEndpoint(t, http.StatusOK)
	p2 := startFakeEndpoint(t, http.StatusServiceUnavailable) // 503
	p3 := startFakeEndpoint(t, http.StatusOK)

	reg := router.NewRegistry(p1, p2, p3)
	checker := health.NewChecker(reg)

	statuses := checker.CheckAll(context.Background())
	if health.AllUp(statuses) {
		t.Error("expected AllUp=false when one endpoint is down")
	}

	downCount := 0
	for _, s := range statuses {
		if !s.Up {
			downCount++
		}
	}
	if downCount != 1 {
		t.Errorf("expected exactly 1 down endpoint, got %d", downCount)
	}
}

func TestCheckAll_ConnectionRefused(t *testing.T) {
	// Use port 19998 — almost certainly nothing listening.
	reg := router.NewRegistry(19998, 19997, 19996)
	checker := health.NewChecker(reg)

	statuses := checker.CheckAll(context.Background())
	for _, s := range statuses {
		if s.Up {
			t.Errorf("expected endpoint %s to be Down (connection refused)", s.Endpoint.Name)
		}
		if s.Error == "" {
			t.Errorf("expected non-empty Error for down endpoint %s", s.Endpoint.Name)
		}
	}
}

func TestAllUp_Empty(t *testing.T) {
	if !health.AllUp(nil) {
		t.Error("AllUp(nil) should return true (vacuously all up)")
	}
}
