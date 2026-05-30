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

// drawdown.rs — Rolling equity curve with peak-drawdown calculation
//
// Drawdown formula: (peak - current) / peak * 100
// where peak is the rolling maximum equity observed so far.
//
// All values in the same unit (e.g. cents). Callers decide units.

/// EquityCurve tracks a time-ordered sequence of equity values
/// and computes current drawdown as a percentage from the rolling peak.
pub struct EquityCurve {
    /// Rolling maximum of all recorded equity values.
    peak: f64,
    /// Most recently recorded equity value.
    current: f64,
    /// Total data points recorded.
    count: u64,
}

impl EquityCurve {
    /// Create a new curve with no data.
    pub fn new() -> Self {
        EquityCurve {
            peak: 0.0,
            current: 0.0,
            count: 0,
        }
    }

    /// Record a new equity data point (in cents or any consistent unit).
    /// Updates rolling peak if `equity` is the new maximum.
    pub fn record(&mut self, equity: f64) {
        if self.count == 0 || equity > self.peak {
            self.peak = equity;
        }
        self.current = equity;
        self.count += 1;
    }

    /// Compute current drawdown percentage from peak.
    ///
    /// Returns `None` if no data has been recorded or peak is 0.
    ///
    /// # Example
    /// ```
    /// let mut curve = EquityCurve::new();
    /// curve.record(1000.0);
    /// curve.record(1100.0);
    /// curve.record(900.0);
    /// // peak = 1100, current = 900
    /// // drawdown = (1100 - 900) / 1100 * 100 = 18.18%
    /// assert!((curve.drawdown_pct().unwrap() - 18.18).abs() < 0.1);
    /// ```
    pub fn drawdown_pct(&self) -> Option<f64> {
        if self.count == 0 || self.peak <= 0.0 {
            return None;
        }
        let dd = (self.peak - self.current) / self.peak * 100.0;
        Some(dd)
    }

    /// Returns true if current drawdown exceeds `threshold_pct`.
    pub fn exceeds_threshold(&self, threshold_pct: f64) -> bool {
        self.drawdown_pct()
            .map(|dd| dd >= threshold_pct)
            .unwrap_or(false)
    }

    /// Current equity value.
    pub fn current(&self) -> f64 {
        self.current
    }

    /// Rolling peak value.
    pub fn peak(&self) -> f64 {
        self.peak
    }

    /// Number of data points recorded.
    pub fn count(&self) -> u64 {
        self.count
    }
}

impl Default for EquityCurve {
    fn default() -> Self {
        Self::new()
    }
}

// ------------------------------------------------------------------ //
// Unit tests

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_curve_returns_none() {
        let curve = EquityCurve::new();
        assert!(curve.drawdown_pct().is_none());
    }

    #[test]
    fn test_no_drawdown_when_monotone_increasing() {
        let mut curve = EquityCurve::new();
        for v in [1000.0, 1100.0, 1200.0, 1300.0] {
            curve.record(v);
        }
        // Peak == current, no drawdown
        let dd = curve.drawdown_pct().unwrap();
        assert!((dd - 0.0).abs() < 0.001, "expected ~0% got {dd}");
    }

    #[test]
    fn test_drawdown_vector_18_2_pct() {
        // Canonical test vector from phase-04 requirements
        // Input: [1000, 1050, 1100, 950, 900]
        // peak=1100, current=900
        // drawdown = (1100 - 900) / 1100 * 100 = 18.1818...%
        let mut curve = EquityCurve::new();
        for v in [1000.0, 1050.0, 1100.0, 950.0, 900.0] {
            curve.record(v);
        }
        let dd = curve.drawdown_pct().unwrap();
        let expected = 18.181818_f64;
        assert!(
            (dd - expected).abs() < 0.1,
            "expected ~{expected:.2}% got {dd:.4}%"
        );
    }

    #[test]
    fn test_drawdown_simple_1000_1100_900() {
        // Simple variant: 1000→1100→900
        let mut curve = EquityCurve::new();
        curve.record(1000.0);
        curve.record(1100.0);
        curve.record(900.0);
        // peak=1100, current=900 → (200/1100)*100 = 18.18%
        let dd = curve.drawdown_pct().unwrap();
        assert!((dd - 18.18).abs() < 0.1, "got {dd}");
    }

    #[test]
    fn test_threshold_exceeded() {
        let mut curve = EquityCurve::new();
        curve.record(1000.0);
        curve.record(800.0); // 20% drawdown
        assert!(curve.exceeds_threshold(10.0));
        assert!(curve.exceeds_threshold(19.9));
        assert!(!curve.exceeds_threshold(21.0));
    }

    #[test]
    fn test_peak_does_not_decrease() {
        let mut curve = EquityCurve::new();
        curve.record(500.0);
        curve.record(1000.0);
        curve.record(200.0); // deep drop
        curve.record(800.0); // recovery, but below old peak
        assert_eq!(curve.peak(), 1000.0);
        // drawdown from peak 1000, current 800 = 20%
        let dd = curve.drawdown_pct().unwrap();
        assert!((dd - 20.0).abs() < 0.001);
    }

    #[test]
    fn test_count_increments() {
        let mut curve = EquityCurve::new();
        assert_eq!(curve.count(), 0);
        curve.record(100.0);
        curve.record(200.0);
        assert_eq!(curve.count(), 2);
    }
}
