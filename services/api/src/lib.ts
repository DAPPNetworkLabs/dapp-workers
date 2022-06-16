export const toMegaBytes = (item) => {
    const sizes = [{name:'KB'},{name:'MB'},{name:'GB'},{name:'TB'}];
    let size = '', base;
    for(const index in sizes) {
        if(item.slice(-2).toUpperCase() == sizes[index].name) {
            size = sizes[index].name;
            base = Number(item.slice(0,-2));
        }
    }
    if(size == '') {
        size = "B";
        base = Number(item.slice(0,-1));
    }
    
    if(size == 'B') {
        return base / (1000 * 1000);
    } else if(size == 'KB') {
        return base / 1000;
    } else if(size == 'MB') {
        return base;
    } else if(size == 'GB') {
        return base * 1000;
    } else if(size == 'TB') {
        return base * 1000 * 1000;
    } else {
        throw new Error(`should not get here: ${size}, ${base}`);
    }
}

export const preCheck = (approvedServices,image,res) => {
    if(!image || !approvedServices.includes(image)) {
        return res.status(401).send("Image doesn't exist or not supported");
    }
}