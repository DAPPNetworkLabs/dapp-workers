// use std::path::Path;
// use std::fs::File;
// use std::io::BufWriter;
use std::env;

fn main() {

    let args: Vec<String> = env::args().collect();
    let queryString = &args[1];
    let body = &args[2];
    let headers = &args[3];
    let verb = &args[4];
    let path = &args[5];
    let fullurl = &args[6];


    println!("Hello from wasm {} {} {} {} {} {}", queryString, body,headers, verb, path, fullurl);
}