# Technical Stack for Cook-Auto-Parallel execution

This document details the architectural and technology choices for implementing parallel autonomous goal execution (`cook-auto-parallel`) within Mekong CLI.

## 1. Concurrency & Scheduling
* **Engine**: Python `concurrent.futures.ThreadPoolExecutor`
* **GIL Mitigation**: Since `LocalExecutor.run()` relies on `subprocess.run`, execution is I/O bound. The GIL is released during subprocess execution, allowing true concurrent shell operations on macOS.
* **Control Flow**:
  - Main loop polls `TaskGraph.ready_tasks()` every 100ms.
  - Submits ready tasks to the ThreadPool.
  - Monitors future objects using `concurrent.futures.as_completed`.

## 2. Database & Thread-Safety
* **Store**: SQLite (`.mekong/goals.sqlite3`)
* **Thread-Safety**:
  - Connection mode: `check_same_thread=False` on sqlite3 connection.
  - Journaling: Enabled Write-Ahead Logging (WAL) via `PRAGMA journal_mode=WAL;` to allow concurrent readers and a writer.
  - Synchronization: Python `threading.Lock()` wrapped around all SQLite transaction scopes in `SQLiteGoalStore` to avoid database locks.

## 3. Concurrency Ceilings (Local Resource Management)
* **LLM Control**: Local LLM inference (e.g. Qwen, Ollama) on macOS suffers from high memory pressure.
* **Ceiling**: Enforce a strict limit `max_workers=3` for local command executions to prevent sandbox Out-of-Memory (OOM) situations and thermal throttling.
