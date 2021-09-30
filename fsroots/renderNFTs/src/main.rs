use std::path::Path;
use std::fs::File;
use std::fs;
use std::io::BufWriter;
use serde::{Deserialize, Serialize};
use serde_json::Result;


struct Definitions {
    theme: String,    
    layers: Vec<Layer>,
}

fn main() {
    // let path = Path::new(r"/tmp1/layers.json");
    // let file = File::create(path).unwrap();
    // let p: Definitions = serde_json::from_str(data)?;

    let paths = fs::read_dir("./tmp1/layers/").unwrap();
    for path in paths {        
        println!("layer:", path.unwrap().path().display());
        let variants = fs::read_dir(path).unwrap();
        for variantPath in variants {
            println!("Name: {}", path.unwrap().path().display())
        }
    }
}