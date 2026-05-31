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

package tools_test

import (
	"context"
	"testing"

	"github.com/mekongmind/engine/internal/tools"
)

func TestRTKProxy_NoopWhenBinaryMissing(t *testing.T) {
	// On CI / dev machines rtk may not be installed.
	// When missing, Compress must return the original text unchanged.
	proxy := tools.NewRTKProxy()

	if proxy.IsAvailable() {
		t.Skip("rtk binary found — skipping noop test")
	}

	input := "some long shell output\nline 1\nline 2\n"
	out, err := proxy.Compress(context.Background(), input)
	if err != nil {
		t.Fatalf("Compress noop: %v", err)
	}
	if out != input {
		t.Errorf("noop Compress changed content: got %q, want %q", out, input)
	}
}

func TestRTKProxy_IsAvailable(t *testing.T) {
	proxy := tools.NewRTKProxy()
	// IsAvailable must return a bool (true or false) without panicking.
	_ = proxy.IsAvailable()
}

func TestRTKProxy_CompressEmptyString(t *testing.T) {
	proxy := tools.NewRTKProxy()
	out, err := proxy.Compress(context.Background(), "")
	if err != nil {
		// Only acceptable error is from rtk binary failure, not from empty input.
		if !proxy.IsAvailable() {
			t.Fatalf("Compress empty noop returned error: %v", err)
		}
	}
	// When noop, empty in = empty out.
	if !proxy.IsAvailable() && out != "" {
		t.Errorf("noop Compress of empty should return empty, got %q", out)
	}
}
