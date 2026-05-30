#!/usr/bin/env python3
"""
test-vn-inference.py — Kiểm tra chất lượng VN inference cho Mekong VN Hub.
Chạy: .venv/bin/python3 scripts/test-vn-inference.py [--model phogpt-4b|qwen3-14b-q4]
"""
import argparse
import json
import sys
import time
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent

# Test cases cho VN business domain
VN_TEST_CASES = [
    {
        "id": "ke-toan-hoa-don",
        "category": "kế toán",
        "prompt": "Tạo hóa đơn điện tử cho giao dịch: Bán 10 cái áo dài, đơn giá 500.000đ/cái, VAT 10%. Người mua: Nguyễn Văn A.",
        "expected_keywords": ["hóa đơn", "5.000.000", "500.000", "VAT", "10%", "Nguyễn Văn A"],
    },
    {
        "id": "thue-tncn",
        "category": "thuế",
        "prompt": "Tính thuế TNCN tháng 5/2026 cho nhân viên có thu nhập gross 30.000.000đ, đã giảm trừ bản thân 11.000.000đ.",
        "expected_keywords": ["thuế", "TNCN", "lũy tiến", "19.000.000", "5%", "10%"],
    },
    {
        "id": "zalo-caption",
        "category": "marketing",
        "prompt": "Viết caption Zalo OA cho shop bán đồ gia dụng, sản phẩm: nồi cơm điện Sunhouse 1.8L, giá 450.000đ. Tone: thân thiện, kêu gọi mua hàng.",
        "expected_keywords": ["nồi cơm", "Sunhouse", "450", "gia dụng"],
    },
    {
        "id": "bhxh-toan-bo",
        "category": "BHXH",
        "prompt": "Tính BHXH, BHYT, BHTN phải đóng cho 1 nhân viên có lương cơ bản 10.000.000đ/tháng tại TP.HCM năm 2026.",
        "expected_keywords": ["BHXH", "BHYT", "BHTN", "8%", "1,5%", "1%"],
    },
]


def test_with_mlx_generate(model_path: str, test_case: dict) -> dict:
    """Chạy test case với mlx_lm.generate CLI."""
    import subprocess

    venv_python = ROOT_DIR / ".venv" / "bin" / "python3"
    start = time.perf_counter()

    result = subprocess.run(
        [
            str(venv_python), "-m", "mlx_lm.generate",
            "--model", str(model_path),
            "--prompt", test_case["prompt"],
            "--max-tokens", "300",
            "--temp", "0.1",
        ],
        capture_output=True,
        text=True,
        timeout=int(__import__("os").environ.get("INFERENCE_TIMEOUT", "120")),
    )

    elapsed_ms = (time.perf_counter() - start) * 1000
    output = result.stdout + result.stderr

    # Check expected keywords
    response_lower = output.lower()
    found_keywords = [kw for kw in test_case["expected_keywords"] if kw.lower() in response_lower]
    keyword_score = len(found_keywords) / len(test_case["expected_keywords"])

    # Extract tok/s
    toks_per_sec = None
    for line in output.split("\n"):
        if "tokens-per-sec" in line:
            try:
                toks_per_sec = float(line.split()[0])
            except (ValueError, IndexError):
                pass

    return {
        "id": test_case["id"],
        "category": test_case["category"],
        "elapsed_ms": round(elapsed_ms),
        "toks_per_sec": toks_per_sec,
        "keyword_score": round(keyword_score * 100),
        "found_keywords": found_keywords,
        "missing_keywords": [kw for kw in test_case["expected_keywords"] if kw.lower() not in response_lower],
        "pass": keyword_score >= 0.5,
        "output_preview": output[:200],
    }


def run_tests(model_name: str) -> None:
    model_path = ROOT_DIR / "models" / model_name

    if not model_path.exists():
        print(f"[ERROR] Model not found: {model_path}")
        print(f"  Chạy: bash scripts/setup-mlx.sh --skip-qwen  (nếu chỉ cần PhoGPT)")
        sys.exit(1)

    print(f"\n=== VN Inference Test: {model_name} ===")
    print(f"Model path: {model_path}\n")

    results = []
    passed = 0

    for i, test_case in enumerate(VN_TEST_CASES, 1):
        print(f"[{i}/{len(VN_TEST_CASES)}] {test_case['category']} — {test_case['id']}")
        result = test_with_mlx_generate(model_path, test_case)
        results.append(result)

        status = "✓ PASS" if result["pass"] else "✗ FAIL"
        print(f"  {status} | Keywords: {result['keyword_score']}% | Time: {result['elapsed_ms']}ms", end="")
        if result["toks_per_sec"]:
            print(f" | Speed: {result['toks_per_sec']:.1f} tok/s")
        else:
            print()
        if result["missing_keywords"]:
            print(f"  Missing: {result['missing_keywords']}")

        if result["pass"]:
            passed += 1

    # Summary
    print(f"\n=== Summary ===")
    print(f"  Passed: {passed}/{len(VN_TEST_CASES)}")
    avg_speed = [r["toks_per_sec"] for r in results if r["toks_per_sec"]]
    if avg_speed:
        print(f"  Avg speed: {sum(avg_speed)/len(avg_speed):.1f} tok/s")

    # Save JSON report
    report_path = ROOT_DIR / "plans" / "reports" / f"vn-inference-{model_name.replace('/', '-')}.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump({"model": model_name, "results": results, "passed": passed, "total": len(VN_TEST_CASES)}, f, ensure_ascii=False, indent=2)
    print(f"  Report: {report_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test VN inference quality")
    parser.add_argument("--model", default="phogpt-4b", help="Model name in models/ dir")
    args = parser.parse_args()
    run_tests(args.model)
