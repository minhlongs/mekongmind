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

// Package cashclaw — signal.go: trading signal emitter.
// Persists signals to BoltDB bucket "signals" and calls guard.RecordEquity
// if a guard is provided. Does NOT produce BUY/SELL/HOLD recommendations.
package cashclaw

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	bolt "go.etcd.io/bbolt"
)

// bucketSignals is the BoltDB bucket name for persisted trading signals.
var bucketSignals = []byte("signals")

// SignalGuard is the subset of ffi.Guard used by the emitter.
// Using an interface prevents a cgo dependency in this package.
type SignalGuard interface {
	RecordEquity(symbol string, equityCents int64) error
}

// TradingSignal captures prediction output that downstream processes can consume.
// No directional advice is included; only numeric data.
type TradingSignal struct {
	ID             string    `json:"id"`
	Symbol         string    `json:"symbol"`
	EstimatedPrice float64   `json:"estimated_price"`
	Confidence     float64   `json:"confidence"`
	Horizon        int       `json:"horizon"`
	EquityCents    int64     `json:"equity_cents"` // last known equity in cents
	EmittedAt      time.Time `json:"emitted_at"`
}

// SignalEmitter writes TradingSignal records to BoltDB and notifies the safety guard.
type SignalEmitter struct {
	db    *bolt.DB
	guard SignalGuard // may be nil
}

// NewSignalEmitter opens (or creates) the BoltDB at dbPath and initialises the emitter.
// guard may be nil — RecordEquity is skipped silently when guard is nil.
func NewSignalEmitter(dbPath string, guard SignalGuard) (*SignalEmitter, error) {
	db, err := bolt.Open(dbPath, 0o600, &bolt.Options{Timeout: 2 * time.Second})
	if err != nil {
		return nil, fmt.Errorf("signal: open db %s: %w", dbPath, err)
	}

	if err := db.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists(bucketSignals)
		return err
	}); err != nil {
		db.Close()
		return nil, fmt.Errorf("signal: create bucket: %w", err)
	}

	return &SignalEmitter{db: db, guard: guard}, nil
}

// Emit persists the signal to BoltDB and calls guard.RecordEquity when guard is non-nil.
// equityCents is the current portfolio equity in integer cents (e.g. 1_000_00 = $1000.00).
func (e *SignalEmitter) Emit(fv *FairValue, equityCents int64) error {
	sig := TradingSignal{
		ID:             fmt.Sprintf("%s-%d", fv.Symbol, time.Now().UnixNano()),
		Symbol:         fv.Symbol,
		EstimatedPrice: fv.EstimatedPrice,
		Confidence:     fv.Confidence,
		Horizon:        len(fv.Forecast),
		EquityCents:    equityCents,
		EmittedAt:      time.Now().UTC(),
	}

	data, err := json.Marshal(sig)
	if err != nil {
		return fmt.Errorf("signal: marshal: %w", err)
	}

	if err := e.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(bucketSignals)
		return b.Put([]byte(sig.ID), data)
	}); err != nil {
		return fmt.Errorf("signal: write to BoltDB: %w", err)
	}

	// Notify safety guard — non-fatal if it fails.
	if e.guard != nil {
		if err := e.guard.RecordEquity(sig.Symbol, equityCents); err != nil {
			log.Printf("signal: guard.RecordEquity(%s, %d) error (non-fatal): %v",
				sig.Symbol, equityCents, err)
		}
	}

	return nil
}

// Close shuts down the BoltDB connection.
func (e *SignalEmitter) Close() error {
	if e.db != nil {
		return e.db.Close()
	}
	return nil
}

// ListSignals returns all TradingSignal records persisted for the given symbol.
// Returns records in insertion order (BoltDB key order).
func (e *SignalEmitter) ListSignals(symbol string) ([]TradingSignal, error) {
	var result []TradingSignal

	err := e.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(bucketSignals)
		prefix := []byte(symbol + "-")
		c := b.Cursor()
		for k, v := c.Seek(prefix); k != nil && len(k) >= len(prefix); k, v = c.Next() {
			// Only process keys that start with "SYMBOL-"
			if string(k[:len(prefix)]) != string(prefix) {
				break
			}
			var sig TradingSignal
			if err := json.Unmarshal(v, &sig); err != nil {
				log.Printf("signal: unmarshal key %s: %v", k, err)
				continue
			}
			result = append(result, sig)
		}
		return nil
	})

	return result, err
}
