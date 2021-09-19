use std::path::Path;
use std::fs::File;
use std::io::BufWriter;

fn main() {
        // Create a new RenderBuffer
        // let decoder = png::Decoder::new(File::open("tests/pngsuite/basi0g01.png").unwrap());

        let path = Path::new(r"/tmp1/test.png");
        let file = File::create(path).unwrap();
        let ref mut w = BufWriter::new(file);
        
        let mut encoder = png::Encoder::new(w, 2, 1); // Width is 2 pixels and height is 1.
        encoder.set_color(png::ColorType::Rgba);
        encoder.set_depth(png::BitDepth::Eight);
        encoder.set_trns(vec!(0xFFu8, 0xFFu8, 0xFFu8, 0xFFu8));
        encoder.set_source_gamma(png::ScaledFloat::from_scaled(45455)); // 1.0 / 2.2, scaled by 100000
        encoder.set_source_gamma(png::ScaledFloat::new(1.0 / 2.2));     // 1.0 / 2.2, unscaled, but rounded
        let source_chromaticities = png::SourceChromaticities::new(     // Using unscaled instantiation here
            (0.31270, 0.32900),
            (0.64000, 0.33000),
            (0.30000, 0.60000),
            (0.15000, 0.06000)
        );
        encoder.set_source_chromaticities(source_chromaticities);
        let mut writer = encoder.write_header().unwrap();
        
        let data = [255, 0, 0, 255, 0, 0, 0, 255]; // An array containing a RGBA sequence. First pixel is red and second pixel is black.
        writer.write_image_data(&data).unwrap(); // Save
        
        // Save the buffer
    println!("Hello, world!");
}