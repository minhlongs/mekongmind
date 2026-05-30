// build.rs — runs cbindgen to generate include/mekong_safety.h
// cbindgen is MPL-2.0 build-time only; NOT linked into the output dylib.

use std::env;
use std::path::PathBuf;

fn main() {
    let crate_dir = env::var("CARGO_MANIFEST_DIR")
        .expect("CARGO_MANIFEST_DIR must be set by cargo");

    let output_file = PathBuf::from(&crate_dir)
        .join("include")
        .join("mekong_safety.h");

    let config = cbindgen::Config::from_file(
        PathBuf::from(&crate_dir).join("cbindgen.toml"),
    )
    .expect("Unable to read cbindgen.toml");

    match cbindgen::generate_with_config(&crate_dir, config) {
        Ok(bindings) => {
            bindings.write_to_file(&output_file);
            println!("cargo:rerun-if-changed=src/lib.rs");
            println!("cargo:rerun-if-changed=cbindgen.toml");
        }
        Err(e) => {
            // Non-fatal on CI environments without cbindgen fully configured;
            // header can also be committed directly.
            eprintln!("cbindgen warning: {e}");
        }
    }
}
