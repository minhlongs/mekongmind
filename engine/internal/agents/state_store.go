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

// Package agents — state_store.go: BoltDB-backed persistence for sessions, steps,
// and observations. Buckets: "agents", "sessions", "steps", "observations".
package agents

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	bolt "go.etcd.io/bbolt"
)

// Bucket names used in BoltDB.
var (
	bucketAgents       = []byte("agents")
	bucketSessions     = []byte("sessions")
	bucketSteps        = []byte("steps")
	bucketObservations = []byte("observations")
)

// SessionRecord is the top-level persisted record for one agent run.
type SessionRecord struct {
	ID        string    `json:"id"`
	AgentRole string    `json:"agent_role"`
	Goal      string    `json:"goal"`
	Status    string    `json:"status"` // "running","done","failed"
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// StateStore wraps a BoltDB file and provides typed CRUD for all buckets.
type StateStore struct {
	db *bolt.DB
}

// OpenStateStore opens (or creates) the BoltDB file at path.
// The file is created with permissions 0600 (user-only read/write).
func OpenStateStore(path string) (*StateStore, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return nil, fmt.Errorf("state_store: mkdir %s: %w", filepath.Dir(path), err)
	}
	db, err := bolt.Open(path, 0600, &bolt.Options{Timeout: 2 * time.Second})
	if err != nil {
		return nil, fmt.Errorf("state_store: open %s: %w", path, err)
	}
	// Ensure all buckets exist.
	err = db.Update(func(tx *bolt.Tx) error {
		for _, bkt := range [][]byte{bucketAgents, bucketSessions, bucketSteps, bucketObservations} {
			if _, err := tx.CreateBucketIfNotExists(bkt); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		db.Close()
		return nil, fmt.Errorf("state_store: create buckets: %w", err)
	}
	return &StateStore{db: db}, nil
}

// Close releases the BoltDB file lock.
func (s *StateStore) Close() error { return s.db.Close() }

// --- SessionRecord CRUD ---

// PutSession writes or overwrites a SessionRecord.
func (s *StateStore) PutSession(rec SessionRecord) error {
	return s.put(bucketSessions, rec.ID, rec)
}

// GetSession retrieves a SessionRecord by ID.
func (s *StateStore) GetSession(id string) (SessionRecord, error) {
	var rec SessionRecord
	return rec, s.get(bucketSessions, id, &rec)
}

// ListInProgressSessions returns all sessions with status "running".
func (s *StateStore) ListInProgressSessions() ([]SessionRecord, error) {
	var out []SessionRecord
	err := s.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(bucketSessions)
		if b == nil {
			return nil
		}
		return b.ForEach(func(_, v []byte) error {
			var rec SessionRecord
			if err := json.Unmarshal(v, &rec); err != nil {
				return nil // skip corrupt entries
			}
			if rec.Status == "running" {
				out = append(out, rec)
			}
			return nil
		})
	})
	return out, err
}

// --- Step CRUD ---

// PutStep writes or overwrites a Step.
func (s *StateStore) PutStep(step Step) error {
	return s.put(bucketSteps, step.ID, step)
}

// GetStep retrieves a Step by ID.
func (s *StateStore) GetStep(id string) (Step, error) {
	var step Step
	return step, s.get(bucketSteps, id, &step)
}

// ListStepsForSession returns all steps belonging to a session, in insertion order.
func (s *StateStore) ListStepsForSession(sessionID string) ([]Step, error) {
	var out []Step
	err := s.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(bucketSteps)
		if b == nil {
			return nil
		}
		return b.ForEach(func(_, v []byte) error {
			var step Step
			if err := json.Unmarshal(v, &step); err != nil {
				return nil
			}
			if step.SessionID == sessionID {
				out = append(out, step)
			}
			return nil
		})
	})
	return out, err
}

// --- Observation CRUD ---

// PutObservation writes or overwrites an Observation.
func (s *StateStore) PutObservation(obs Observation) error {
	return s.put(bucketObservations, obs.StepID, obs)
}

// GetObservation retrieves an Observation by step ID.
func (s *StateStore) GetObservation(stepID string) (Observation, error) {
	var obs Observation
	return obs, s.get(bucketObservations, stepID, &obs)
}

// --- Generic helpers ---

func (s *StateStore) put(bucket []byte, key string, val any) error {
	data, err := json.Marshal(val)
	if err != nil {
		return fmt.Errorf("state_store: marshal: %w", err)
	}
	return s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(bucket)
		if b == nil {
			return fmt.Errorf("state_store: bucket %s missing", bucket)
		}
		return b.Put([]byte(key), data)
	})
}

func (s *StateStore) get(bucket []byte, key string, out any) error {
	return s.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(bucket)
		if b == nil {
			return fmt.Errorf("state_store: bucket %s missing", bucket)
		}
		v := b.Get([]byte(key))
		if v == nil {
			return fmt.Errorf("state_store: key %q not found in %s", key, bucket)
		}
		return json.Unmarshal(v, out)
	})
}
